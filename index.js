const express = require('express');
const { Router } = require('express');
const hbs = require('express-handlebars');
const { Server: HttpServer } = require('http');
const {Server: SocketIO } = require('socket.io');
let fs = require('fs');


const PORT = 3000;
const app = express();
const path = require('path');
const http = new HttpServer(app);
const io = new SocketIO(http);

let productos = [];
let mensajes = [];
//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.engine("handlebars", hbs.engine());
app.set('views', __dirname + '/views');
// ------- HANDLEBARS -------------
app.set('view engine', 'handlebars');

let routerProductos = new Router();

app.get('/', (req, res) => {
    res.render("index", { productos });
});

io.on("connection", async socket => {
    let oldMessages =  await fs.promises.readFile('./mensajes.txt', 'utf-8');
    mensajes = JSON.parse(oldMessages);
    socket.emit("init", productos);
    socket.emit("init_message", mensajes);
    socket.emit("update_table", productos);
    socket.on("add_product", producto => {
        let new_product = {
            id: productos.length + 1,
            ...producto
        }
        productos.push(new_product);
        io.sockets.emit("update_table", productos);
    })
    socket.on("send_mensaje", async mensaje => {
        let newMessage = {
            id: mensajes.length + 1,
            ...mensaje
        }
        mensajes.push(newMessage);
        await fs.promises.writeFile('./mensajes.txt', JSON.stringify(mensajes));
        io.sockets.emit("update_message", mensajes);
    })
});

// routerProductos.get('/:id', (req, res) => {
//     let { id } = req.params;
//     let producto = productos.find(producto => producto.id === Number(id));
//     if (producto) {
//         res.json(producto);
//     } else {
//         res.status(404).json({ error: 'Producto no encontrado' });
//     }
// });

// routerProductos.post('/', (req, res) => {
//     const {title, price, thumbnail} = req.body;
//     let producto = {
//         id: productos.length + 1,
//         title,
//         price,
//         thumbnail
//     };
//     productos.push(producto);
//     res.render("index", {productos});
// });

// routerProductos.put('/:id', (req, res) => {
//     const { id } = req.params;
//     const { title, price, thumbnail } = req.body;
//     const producto = productos.find(producto => producto.id === Number(id));
//     if (producto) {
//         if (title) {
//             producto.title = title;
//         }
//         if (price) {
//             producto.price = price;
//         }
//         if (thumbnail) {
//             producto.thumbnail = thumbnail;
//         }
//         res.json(producto);
//     } else {
//         res.status(404).json({ error: 'Producto no encontrado' });
//     }
// });

// routerProductos.delete('/:id', (req, res) => {
//     const { id } = req.params;
//     const producto = productos.findIndex(producto => producto.id === Number(id));
//     if (producto) {
//         productos.splice(producto, 1);
//         res.json(productos);
//     } else {
//         res.status(404).json({ error: 'Producto no encontrado' });
//     }
// });

app.use("/api/productos", routerProductos);

http.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
});
// Seleccionar la base de datos
use ecommerce_db;

// Definir la cantidad exigida por la rúbrica
const CANTIDAD = 500;

print("Iniciando generación de datos...");

// 1. Función para pre-generar ObjectIds
function generarIds(cantidad) {
    let ids = [];
    for (let i = 0; i < cantidad; i++) {
        ids.push(new ObjectId());
    }
    return ids;
}

// 2. Pre-generar los IDs para las colecciones que se referencian
const proveedoresIds = generarIds(CANTIDAD);
const categoriasIds = generarIds(CANTIDAD);
const clientesIds = generarIds(CANTIDAD);
const productosIds = generarIds(CANTIDAD);

// 3. Arreglos para almacenar los documentos
let proveedores = [];
let categorias = [];
let clientes = [];
let productos = [];
let stock = [];
let pedidos = [];
let ordenesCompra = [];

// 4. Bucle principal de generación de datos
for (let i = 0; i < CANTIDAD; i++) {
    
    // --- PROVEEDORES ---
    proveedores.push({
        _id: proveedoresIds[i],
        nombre: `Proveedor_Tech_${i}`,
        telefono: `+5690000${i.toString().padStart(4, '0')}`,
        direcciones: [
            { tipo: "Matriz", calle: `Calle Falsa ${100 + i}`, ciudad: "Santiago" }
        ]
    });

    // --- CATEGORÍAS (Referencia a Productos incorporada) ---
    categorias.push({
        _id: categoriasIds[i],
        nombre: `Categoría_Hardware_${i}`,
        subcategoria: { nombre: `Subcategoría_${i}`, nivel: 2 },
        // Referenciamos el producto correspondiente usando el ID pre-generado
        productos: [ productosIds[i] ] 
    });

    // --- CLIENTES ---
    clientes.push({
        _id: clientesIds[i],
        nombre: `Cliente_Prueba_${i}`,
        telefono: `+5698888${i.toString().padStart(4, '0')}`,
        direcciones: [
            { tipo: "Casa", calle: `Avenida Principal ${i}`, ciudad: "Santiago" }
        ],
        metodo_de_pago: [
            { tipo: "Tarjeta de Crédito", ultimos_digitos: (1000 + i).toString().slice(-4), banco: "Banco de Chile" }
        ]
    });

    // --- PRODUCTOS ---
    productos.push({
        _id: productosIds[i],
        categorias: [ categoriasIds[i] ], // Referencia a Categorías
        proveedores: [ proveedoresIds[i] ], // Referencia a Proveedores
        especificaciones: {
            marca: "Generica",
            modelo: `Modelo_V${i}`,
            peso_kg: (Math.random() * 5).toFixed(2)
        }
    });

    // --- STOCK ---
    stock.push({
        productos: productosIds[i], // Referencia a Productos
        variaciones: [
            { color: "Negro", cantidad_disponible: Math.floor(Math.random() * 100) + 1 },
            { color: "Blanco", cantidad_disponible: Math.floor(Math.random() * 50) + 1 }
        ]
    });

    // --- PEDIDOS ---
    pedidos.push({
        clientes: clientesIds[i], // Referencia a Clientes
        fecha_pedido: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))),
        detalle: [
            { 
                producto_id: productosIds[i], 
                cantidad: Math.floor(Math.random() * 3) + 1, 
                precio_unitario: Math.floor(Math.random() * 100000) + 10000 
            }
        ]
    });

    // --- ÓRDENES DE COMPRA ---
    ordenesCompra.push({
        proveedor: proveedoresIds[i], // Referencia a Proveedores
        fecha_emision: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 15))),
        detalle: [
            { 
                producto_id: productosIds[i], 
                cantidad: Math.floor(Math.random() * 50) + 10, 
                costo_unitario: Math.floor(Math.random() * 50000) + 5000 
            }
        ]
    });
}

// 5. Inserción masiva en la base de datos
print("Insertando Proveedores...");
db.proveedores.insertMany(proveedores);

print("Insertando Categorías...");
db.categorias.insertMany(categorias);

print("Insertando Clientes...");
db.clientes.insertMany(clientes);

print("Insertando Productos...");
db.productos.insertMany(productos);

print("Insertando Stock...");
db.stock.insertMany(stock);

print("Insertando Pedidos...");
db.pedidos.insertMany(pedidos);

print("Insertando Órdenes de Compra...");
db.ordenes_compra.insertMany(ordenesCompra);

print(`¡Proceso completado! Se insertaron ${CANTIDAD} registros en cada una de las 7 colecciones.`);
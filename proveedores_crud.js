// db.proveedores.drop(); // Limpia la colección si ya existía

const proveedores = [];
const paises = ["Chile", "China", "Estados Unidos", "Alemania"];
const regiones = ["Metropolitana", "Valparaíso", "Biobío", "Antofagasta"];
const comunas = ["Santiago", "Providencia", "Las Condes", "Maipú"];
const representantes = ["Juan Pérez", "María González", "Carlos Silva", "Ana Morales", "Roberto Díaz"];

for (let i = 1; i <= 500; i++) {
  const pais = paises[i % paises.length];
  const region = regiones[i % regiones.length];
  const comuna = comunas[i % comunas.length];
  const rep = representantes[i % representantes.length];
  
  // Para garantizar exactamente 50 registros para eliminar
  const estadoContrato = (i <= 50) ? "Finalizado" : ((i % 2 === 0) ? "Activo" : "En Revision");
  const estaActivo = (i > 50);

  proveedores.push({
    nombre: `Proveedor_Tech_${i} SpA`,
    representante: rep,
    telefono: `+5690000${i.toString().padStart(4, '0')}`,
    pais_origen: pais,
    estado_contrato: estadoContrato,
    activo: estaActivo,
    ordenes_asociadas_count: (i * 7) % 200,
    contacto: {
      email: `contacto@proveedor${i}.com`,
      telefono_directo: `+5622000${i.toString().padStart(4, '0')}`
    },
    direcciones: [
      {
        tipo: "Matriz",
        calle: `Calle Falsa ${100 + i}`,
        comuna: comuna,
        ciudad: "Santiago",
        region: region
      },
      {
        tipo: "Sucursal",
        calle: `Avenida Central ${500 + i}`,
        comuna: "Providencia",
        ciudad: "Santiago",
        region: "Metropolitana"
      }
    ]
  });
}

db.proveedores.insertMany(proveedores);
print(`Insertados ${db.proveedores.countDocuments()} proveedores.`);

// ============================== 10 CONSULTAS DE LECTURA (READ) ==============================

// Filtrar proveedores por país de origen "Chile"
db.proveedores.find({ pais_origen: "Chile" });

// Filtrar proveedores por región "Metropolitana" en sus direcciones embebidas
db.proveedores.find({ "direcciones.region": "Metropolitana" });

// Filtrar proveedores con dirección embebida tipo "Matriz" en la comuna de "Providencia"
db.proveedores.find({ "direcciones": { $elemMatch: { tipo: "Matriz", comuna: "Providencia" } } });

// Buscar proveedores con estado de contrato "Activo" y que pertenezcan a "China"
db.proveedores.find({ estado_contrato: "Activo", pais_origen: "China" });

// Filtrar por nombre de representante específico "María González"
db.proveedores.find({ representante: "María González" });

// Proveedores internacionales (país de origen distinto a Chile)
db.proveedores.find({ pais_origen: { $ne: "Chile" } });

// Proveedores con más de 100 órdenes de compra asociadas
db.proveedores.find({ ordenes_asociadas_count: { $gt: 100 } });

// Buscar proveedores que tengan email de contacto terminado en ".com"
db.proveedores.find({ "contacto.email": /@proveedor1.*\.com$/ });

// Buscar proveedores activos que no estén en la región de Valparaíso
db.proveedores.find({ activo: true, "direcciones.region": { $ne: "Valparaíso" } });

// Buscar proveedores con contratos "En Revision" o "Finalizado"
db.proveedores.find({ estado_contrato: { $in: ["En Revision", "Finalizado"] } });

// ============================== 10 ACTUALIZACIONES (UPDATE) ==============================

// Actualizar el teléfono de contacto de un proveedor específico
db.proveedores.updateOne(
  { nombre: "Proveedor_Tech_100 SpA" },
  { $set: { telefono: "+56999999999" } }
);

// Cambiar la comuna de la oficina Matriz de los proveedores de la región Antofagasta
db.proveedores.updateMany(
  { "direcciones.region": "Antofagasta" },
  { $set: { "direcciones.$[elem].comuna": "Antofagasta Centro" } },
  { arrayFilters: [{ "elem.tipo": "Matriz" }] }
);

// Modificar el nombre del representante para los proveedores de "Alemania"
db.proveedores.updateMany(
  { pais_origen: "Alemania" },
  { $set: { representante: "Hans Gruber" } }
);

// Actualizar email del contacto principal de los proveedores en revisión
db.proveedores.updateMany(
  { estado_contrato: "En Revision" },
  { $set: { "contacto.email": "auditoria@proveedor.com" } }
);

// Desactivar proveedores con 0 órdenes asociadas
db.proveedores.updateMany(
  { ordenes_asociadas_count: 0 },
  { $set: { activo: false } }
);

// Renombrar un proveedor cambiando su razón social
db.proveedores.updateOne(
  { nombre: "Proveedor_Tech_200 SpA" },
  { $set: { nombre: "Proveedor_Tech_200 Internacional SpA" } }
);

// Agregar una nueva dirección embebida tipo "Bodega" a un proveedor
db.proveedores.updateOne(
  { nombre: "Proveedor_Tech_50 SpA" },
  { $push: { direcciones: { tipo: "Bodega", calle: "Ruta 5 Norte Km 20", comuna: "Lampa", ciudad: "Santiago", region: "Metropolitana" } } }
);

// Incrementar el conteo de órdenes asociadas en 10 para proveedores en Chile
db.proveedores.updateMany(
  { pais_origen: "Chile" },
  { $inc: { ordenes_asociadas_count: 10 } }
);

// Cambiar el estado de contrato a "Renovado" para proveedores activos con más de 150 órdenes
db.proveedores.updateMany(
  { activo: true, ordenes_asociadas_count: { $gt: 150 } },
  { $set: { estado_contrato: "Renovado" } }
);

// Modificar el teléfono directo de la estructura embebida contacto
db.proveedores.updateOne(
  { nombre: "Proveedor_Tech_1 SpA" },
  { $set: { "contacto.telefono_directo": "+56229998888" } }
);

// ============================== 50 ELIMINACIONES (DELETE) ==============================

// Eliminar 50 proveedores con contratos finalizados e inactivos (registros del 1 al 50)
db.proveedores.deleteMany({
  estado_contrato: "Finalizado",
  activo: false
});

// ============================== 10 AGREGACIONES (AGGREGATE) ==============================

// Conteo de proveedores por país de origen
db.proveedores.aggregate([
  { $group: { _id: "$pais_origen", total_proveedores: { $sum: 1 } } },
  { $sort: { total_proveedores: -1 } }
]);

// Promedio de órdenes asociadas por país de origen
db.proveedores.aggregate([
  { $group: { _id: "$pais_origen", promedio_ordenes: { $avg: "$ordenes_asociadas_count" } } }
]);

// Descomponer direcciones ($unwind) y contar proveedores por región de dirección
db.proveedores.aggregate([
  { $unwind: "$direcciones" },
  { $group: { _id: "$direcciones.region", total: { $sum: 1 } } }
]);

// Agrupar por volumen de órdenes (Rango Alto vs Bajo)
db.proveedores.aggregate([
  {
    $project: {
      nombre: 1,
      categoria_volumen: {
        $cond: { if: { $gte: ["$ordenes_asociadas_count", 100] }, then: "Alto Volumen", else: "Bajo/Medio Volumen" }
      }
    }
  },
  { $group: { _id: "$categoria_volumen", total: { $sum: 1 } } }
]);

// Conteo de proveedores según el estado de su contrato
db.proveedores.aggregate([
  { $group: { _id: "$estado_contrato", cantidad: { $sum: 1 } } }
]);

// Top 5 proveedores con mayor volumen de órdenes asociadas
db.proveedores.aggregate([
  { $match: { activo: true } },
  { $sort: { ordenes_asociadas_count: -1 } },
  { $limit: 5 },
  { $project: { nombre: 1, ordenes_asociadas_count: 1, pais_origen: 1 } }
]);

// Agrupación por combinación de País de Origen y Estado de Contrato
db.proveedores.aggregate([
  { $group: { _id: { pais: "$pais_origen", estado: "$estado_contrato" }, total: { $sum: 1 } } }
]);

// Filtrar proveedores con más de 50 órdenes y contar cuántos hay por comuna de oficina Matriz
db.proveedores.aggregate([
  { $match: { ordenes_asociadas_count: { $gt: 50 } } },
  { $unwind: "$direcciones" },
  { $match: { "direcciones.tipo": "Matriz" } },
  { $group: { _id: "$direcciones.comuna", total_matriz: { $sum: 1 } } }
]);

// Máximo y mínimo de órdenes asociadas registradas por representante
db.proveedores.aggregate([
  {
    $group: {
      _id: "$representante",
      max_ordenes: { $max: "$ordenes_asociadas_count" },
      min_ordenes: { $min: "$ordenes_asociadas_count" }
    }
  }
]);

// Obtener total de proveedores activos versus inactivos por país
db.proveedores.aggregate([
  {
    $group: {
      _id: { pais: "$pais_origen", activo: "$activo" },
      total: { $sum: 1 }
    }
  },
  { $sort: { "_id.pais": 1 } }
]);
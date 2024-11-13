'use strict';

const db = require('./lib/db')(); // Usando tu configuración personalizada de conexión
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const moment = require('moment');

// Conectar a la base de datos
db.connect();

// Definir el esquema de suscripción
const subscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Configurar el transportador de correo electrónico con Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Cambiar según el proveedor que uses
  auth: {
    user: 'tu_correo@gmail.com',
    pass: 'tu_contraseña',
  }
});

// Función para enviar un correo electrónico
async function sendEmail(to, subject, message) {
  try {
    const mailOptions = {
      from: '"BigSeer" <tu_correo@gmail.com>',
      to,
      subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado a: ${to}`);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
}

// Función para validar suscripciones y enviar correos
async function validateSubscriptions() {
  try {
    // Calcular el rango de fechas para 2 días antes de la expiración
    const twoDaysFromNow = moment().add(2, 'days').startOf('day').toDate();
    const oneDayFromNow = moment().add(2, 'days').endOf('day').toDate();

    // Buscar suscripciones que expiran en 2 días
    const expiringSubscriptions = await Subscription.find({
      expiresAt: { $gte: twoDaysFromNow, $lte: oneDayFromNow }
    });

    if (expiringSubscriptions.length > 0) {
      console.log(`Suscripciones por vencer: ${expiringSubscriptions.length}`);

      for (const sub of expiringSubscriptions) {
        const message = `Hola, tu suscripción está por vencer el ${moment(sub.expiresAt).format('DD/MM/YYYY')}. ¡Renueva a tiempo para no perder acceso!`;
        await sendEmail(sub.email, 'Aviso de Suscripción Próxima a Vencer', message);
      }
    } else {
      console.log('No hay suscripciones por vencer en los próximos 2 días.');
    }
  } catch (error) {
    console.error('Error al validar suscripciones:', error);
  }
}

// Ejecutar la validación una vez al inicio
validateSubscriptions();

// Configurar el demonio para que se ejecute todos los días a las 8:00 AM usando node-cron
const cron = require('node-cron');
cron.schedule('0 8 * * *', validateSubscriptions, {
  timezone: "America/Mexico_City" // Ajusta según tu zona horaria
});

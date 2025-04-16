require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Токен бота из переменной окружения
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('BOT_TOKEN is not defined. Please set it in .env or environment variables.');
  process.exit(1);
}
const bot = new TelegramBot(token, { polling: true });

// Ссылки
const websiteUrl = 'https://avobankintern.netlify.app/';
const formUrl = 'https://docs.google.com/forms/d/1ZBJ_B04g9iINMjkBbuuArEm0MQ0iSoQMEVtAju-uQiI/viewform';

// Хранилище для отслеживания согласия
const userConsent = new Map();

// Настройка кнопки Web App
const webAppButton = {
  text: 'Ознакомиться с офертой',
  web_app: { url: websiteUrl }
};

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`Received /start from user ${msg.from.id}`);
  bot.sendMessage(chatId, 'Добро пожаловать в Заявку на посещение Лекции AVO MIND! Ознакомьтесь с публичной офертой:', {
    reply_markup: {
      inline_keyboard: [[webAppButton]]
    }
  }).catch((error) => {
    console.error('Error sending message:', error);
  });
});

// Обработка данных от Web App
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  console.log(`Received message from user ${userId}:`, msg);

  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      console.log(`Web App data received:`, data);
      if (data.agreementAccepted) {
        userConsent.set(userId, true);
        bot.sendMessage(chatId, 'Спасибо за согласие с офертой! Теперь заполните анкету для посещения Лекции AVO MIND:', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Перейти к анкете', url: formUrl }]]
          }
        }).catch((error) => {
          console.error('Error sending form link:', error);
        });
        console.log(`User ${userId} accepted offer at ${new Date()}`);
      } else {
        bot.sendMessage(chatId, 'Пожалуйста, согласитесь с офертой, чтобы продолжить.').catch((error) => {
          console.error('Error sending rejection message:', error);
        });
      }
    } catch (error) {
      console.error('Error parsing Web App data:', error);
      bot.sendMessage(chatId, 'Произошла ошибка при обработке данных. Пожалуйста, попробуйте снова.').catch((error) => {
        console.error('Error sending error message:', error);
      });
    }
  }
});

// Обработка ошибок polling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Настройка Express для Render
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000, () => console.log('Server running on port', process.env.PORT || 3000));

module.exports = app;
import { request } from "@app/request"
import { getDownloadUrl } from "@app/storage"

// @shared-route
export const apiPublishToTelegramRoute = app.post('/publish-to-telegram', async (ctx, req) => {
  ctx.account.log('publishToTelegram - Request received', {
    level: 'info',
    json: { 
      hasImageHash: !!req.body.imageHash,
      bodyKeys: Object.keys(req.body || {})
    }
  })
  
  // Extract data from request body
  const { botToken, channelId, messageText, buttonText, callbackData, imageHash } = req.body
  
  ctx.account.log('publishToTelegram - Extracted data', {
    level: 'info',
    json: { 
      hasBotToken: !!botToken,
      hasChannelId: !!channelId, 
      hasImageHash: !!imageHash
    }
  })

  // Validation
  if (!botToken || !channelId) {
    return { success: false, error: 'Токен бота и ID канала обязательны' }
  }

  if (!messageText && !imageHash) {
    return { success: false, error: 'Необходимо указать текст сообщения или изображение' }
  }

  // Character limit validation
  const maxChars = imageHash ? 1000 : 4000
  if (messageText && messageText.length > maxChars) {
    return {
      success: false,
      error: `Текст сообщения превышает лимит в ${maxChars} символов`
    }
  }

  // Validate button data
  if (buttonText && !callbackData) {
    return {
      success: false,
      error: 'Для кнопки необходимо указать callback data'
    }
  }

  let telegramResponse
  const baseUrl = `https://api.telegram.org/bot${botToken}`

  if (imageHash) {
    // Send photo with caption

    const imageUrl = getDownloadUrl(ctx, imageHash)
    const messageData: any = {
      chat_id: channelId,
      photo: imageUrl
    }

    if (messageText) {
      messageData.caption = messageText
      messageData.parse_mode = 'Markdown'
    }

    // Add inline keyboard if button is provided
    if (buttonText && callbackData) {
      messageData.reply_markup = {
        inline_keyboard: [[
          {
            text: buttonText,
            callback_data: callbackData
          }
        ]]
      }
    }

    ctx.account.log('publishToTelegram - Sending photo to Telegram', {
      level: 'info',
      json: {
        url: `${baseUrl}/sendPhoto`,
        chatId: channelId,
        imageUrl: imageUrl,
        hasCaption: !!messageText,
        hasButton: !!(buttonText && callbackData)
      }
    })

    try {
      telegramResponse = await request.post(`${baseUrl}/sendPhoto`, messageData)
      
      ctx.account.log('publishToTelegram - Telegram response (photo)', {
        level: 'info',
        json: {
          success: !!telegramResponse.body?.ok,
          response: telegramResponse.body
        }
      })
      
    } catch (error) {
      ctx.account.log('publishToTelegram - Telegram API Error (sendPhoto)', {
        level: 'error',
        json: { error: error, errorDetails: error?.response?.body || error?.message }
      })
      return {
        success: false,
        error: parseApiError(error)
      }
    }
    
  } else {
    // Send text message
    const messageData: any = {
      chat_id: channelId,
      text: messageText,
      parse_mode: 'Markdown'
    }

    // Add inline keyboard if button is provided
    if (buttonText && callbackData) {
      messageData.reply_markup = {
        inline_keyboard: [[
          {
            text: buttonText,
            callback_data: callbackData
          }
        ]]
      }
    }

    ctx.account.log('publishToTelegram - Sending message to Telegram', {
      level: 'info',
      json: {
        url: `${baseUrl}/sendMessage`,
        chatId: channelId,
        messageLength: messageText?.length,
        hasButton: !!(buttonText && callbackData)
      }
    })

    try {
      telegramResponse = await request.post(`${baseUrl}/sendMessage`, messageData)
      
      ctx.account.log('publishToTelegram - Telegram response (message)', {
        level: 'info',
        json: {
          success: !!telegramResponse.body?.ok,
          response: telegramResponse.body
        }
      })
      
    } catch (error) {
      ctx.account.log('publishToTelegram - Telegram API Error (sendMessage)', {
        level: 'error',
        json: { error: error, errorDetails: error?.response?.body || error?.message }
      })
      return {
        success: false,
        error: parseApiError(error)
      }
    }
  }

  // Check if Telegram API returned success
  ctx.account.log('publishToTelegram - Final response check', {
    level: 'info',
    json: {
      telegramResponseOk: telegramResponse.body?.ok,
      telegramResponseBody: telegramResponse.body
    }
  })
  
  if (telegramResponse.body && telegramResponse.body.ok) {
    const messageId = telegramResponse.body.result.message_id
    return {
      success: true,
      messageId: messageId,
      message: 'Публикация успешно отправлена в Telegram'
    }
  } else {
    const errorDescription = telegramResponse.body?.description || 'Неизвестная ошибка API Telegram'
    return {
      success: false,
      error: `Ошибка Telegram API: ${errorDescription}`
    }
  }

})

function parseApiError(error: any): string {
  if (error.response && error.response.body) {
    const errorBody = error.response.body
    if (errorBody.description) {
      const description = errorBody.description.toLowerCase()
      
      if (description.includes('chat not found')) {
        return 'Канал не найден. Проверьте правильность ID канала'
      }
      
      if (description.includes('bot is not a member') || 
          description.includes('insufficient rights')) {
        return 'Бот не является администратором канала или не имеет прав на отправку сообщений'
      }
      
      if (description.includes('bad request')) {
        return 'Неверный запрос. Проверьте корректность данных'
      }
      
      if (description.includes('file too large')) {
        return 'Файл слишком большой для отправки в Telegram'
      }
      
      if (description.includes('unauthorized')) {
        return 'Неверный токен бота. Проверьте правильность токена'
      }
      
      return `Ошибка Telegram API: ${errorBody.description}`
    }
  }
  
  if (error.message && error.message.includes('network')) {
    return 'Ошибка сети. Проверьте интернет-соединение'
  }
  
  return 'Произошла неизвестная ошибка при отправке в Telegram'
}
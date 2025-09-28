<template>
  <div class="min-h-screen py-8 px-4">
    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center animate-pulse">
        <div class="mb-4">
          <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-2">Успешно отправлено!</h3>
        <p class="text-gray-600 mb-4">{{ successMessage }}</p>
        <div class="text-sm text-gray-500">Окно закроется через {{ countdown }} сек.</div>
      </div>
    </div>
    
    <!-- File Upload Loading Modal -->
    <div v-if="isUploading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-2xl text-blue-500 mb-3"></i>
          <p class="text-gray-700 mb-2">Загрузка файла...</p>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" :style="{width: uploadProgress + '%'}"></div>
          </div>
          <p class="text-sm text-gray-500 mt-2">{{ uploadProgress }}%</p>
        </div>
      </div>
    </div>
    <div class="max-w-7xl mx-auto">
      <h1 class="text-4xl font-bold text-white text-center mb-8">
        <i class="fab fa-telegram-plane mr-3 text-blue-300"></i>
        Telegram Channel Publisher
      </h1>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <!-- Form Column -->
        <div class="bg-white rounded-xl shadow-xl p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-6">Создать публикацию</h2>
          
          <form @submit.prevent="submitForm">
            <!-- Bot Token -->
            <div class="form-field">
              <label class="form-label">
                <i class="fas fa-robot mr-2"></i>
                Токен бота
              </label>
              <input
                v-model="form.botToken"
                type="password"
                class="form-input"
                placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                required
              />
              <p class="text-sm text-gray-600 mt-1">
                Получите токен у <a href="https://t.me/BotFather" target="_blank" class="text-blue-600 hover:underline">@BotFather</a>. Бот должен быть админом в канале или группе
              </p>
            </div>

            <!-- Channel ID/Username -->
            <div class="form-field">
              <label class="form-label">
                <i class="fas fa-at mr-2"></i>
                ID канала или username
              </label>
              <input
                v-model="form.channelId"
                type="text"
                class="form-input"
                placeholder="@mychannel или -100123456789"
                required
              />
              <p class="text-sm text-gray-600 mt-1">
                Username канала (с @) или числовой ID (с минусом для супергрупп)
              </p>
            </div>

            <!-- Image Upload -->
            <div class="form-field">
              <label class="form-label">
                <i class="fas fa-image mr-2"></i>
                Изображение (необязательно)
              </label>
              <div
                ref="fileDropZone"
                class="file-upload-area"
                :class="{ 'dragover': isDragging }"
                @click="$refs.fileInput?.click()"
                @dragover.prevent="isDragging = true"
                @dragenter.prevent
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleFileDrop"
              >
                <div v-if="!selectedFile">
                  <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                  <p class="text-gray-600">Нажмите или перетащите изображение</p>
                  <p class="text-sm text-gray-500 mt-1">JPG, JPEG, PNG до 5 МБ</p>
                </div>
                <div v-else class="text-center">
                  <img :src="previewImage" alt="Preview" class="max-h-32 mx-auto mb-2 rounded" />
                  <p class="text-sm text-gray-600">{{ uploadedImageName }}</p>
                  <button
                    type="button"
                    @click.stop="removeImage"
                    class="text-red-600 hover:text-red-800 mt-2"
                  >
                    <i class="fas fa-trash mr-1"></i>Удалить
                  </button>
                </div>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                @change="handleFileSelect"
                class="hidden"
              />
              <p v-if="errors.image" class="error-message">{{ errors.image }}</p>
            </div>

            <!-- Message Text -->
            <div class="form-field">
              <label class="form-label">
                <i class="fas fa-comment mr-2"></i>
                Текст публикации
              </label>
              
              <!-- Formatting Toolbar -->
              <div class="formatting-toolbar">
                <button
                  type="button"
                  class="formatting-button"
                  :class="{ active: activeFormats.bold }"
                  @click="toggleFormat('bold')"
                  title="Жирный текст"
                >
                  <i class="fas fa-bold"></i>
                </button>
                <button
                  type="button"
                  class="formatting-button"
                  :class="{ active: activeFormats.italic }"
                  @click="toggleFormat('italic')"
                  title="Курсив"
                >
                  <i class="fas fa-italic"></i>
                </button>
                <button
                  type="button"
                  class="formatting-button"
                  :class="{ active: activeFormats.underline }"
                  @click="toggleFormat('underline')"
                  title="Подчеркнутый"
                >
                  <i class="fas fa-underline"></i>
                </button>
                <button
                  type="button"
                  class="formatting-button"
                  :class="{ active: activeFormats.code }"
                  @click="toggleFormat('code')"
                  title="Код"
                >
                  <i class="fas fa-code"></i>
                </button>
                <button
                  type="button"
                  class="formatting-button"
                  @click="insertLink"
                  title="Ссылка"
                >
                  <i class="fas fa-link"></i>
                </button>
              </div>

              <textarea
                ref="messageTextarea"
                v-model="form.messageText"
                class="form-input form-textarea"
                :class="{ 'rounded-t-none border-t-0': true }"
                placeholder="Введите текст сообщения..."
                @input="updateCharCount"
                @select="updateSelection"
                @keyup="updateSelection"
              ></textarea>
              
              <div
                class="char-counter"
                :class="{
                  warning: remainingChars < maxChars * 0.2,
                  error: remainingChars < 0
                }"
              >
                {{ charCount }} / {{ maxChars }} символов
              </div>
              <p class="text-sm text-gray-600 mt-1">
                {{ form.imageHash ? 'С изображением до 1000 символов' : 'Без изображения до 4000 символов' }}
              </p>
              <p v-if="errors.messageText" class="error-message">{{ errors.messageText }}</p>
            </div>

            <!-- Button Text -->
            <div class="form-field">
              <label class="form-label">
                <i class="fas fa-mouse-pointer mr-2"></i>
                Текст кнопки (необязательно)
              </label>
              <input
                v-model="form.buttonText"
                type="text"
                class="form-input"
                placeholder="Нажмите здесь"
                maxlength="64"
              />
            </div>

            <!-- Button Callback Data -->
            <div class="form-field" v-if="form.buttonText">
              <label class="form-label">
                <i class="fas fa-code mr-2"></i>
                Callback Data кнопки
              </label>
              <input
                v-model="form.callbackData"
                type="text"
                class="form-input"
                placeholder="button_clicked"
                maxlength="64"
              />
              <p class="text-sm text-gray-600 mt-1">
                Данные, которые будут отправлены при нажатии на кнопку
              </p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn-primary w-full"
              :disabled="isSubmitting || !isFormValid"
            >
              <i class="fas fa-paper-plane mr-2" v-if="!isSubmitting"></i>
              <i class="fas fa-spinner fa-spin mr-2" v-if="isSubmitting"></i>
              {{ isSubmitting ? 'Отправляем...' : 'Опубликовать' }}
            </button>

            <div v-if="errorMessage" class="error-message mt-3 p-3 bg-red-100 rounded">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              {{ errorMessage }}
            </div>
          </form>
        </div>

        <!-- Preview Column -->
        <div class="bg-white rounded-xl shadow-xl p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-6">
            <i class="fab fa-telegram-plane mr-2"></i>
            Предварительный просмотр
          </h2>
          
          <div class="telegram-preview">
            <div class="telegram-message">
              <!-- Channel Info -->
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <i class="fab fa-telegram-plane text-white"></i>
                </div>
                <div>
                  <div class="font-semibold text-white">
                    {{ form.channelId || 'Ваш канал' }}
                  </div>
                  <div class="text-xs text-gray-400">сейчас</div>
                </div>
              </div>

              <!-- Image Preview -->
              <div v-if="selectedFile && previewImage" class="mb-3">
                <img
                  :src="previewImage"
                  alt="Preview"
                  class="w-full max-w-sm rounded-lg"
                />
              </div>

              <!-- Message Text -->
              <div
                v-if="form.messageText"
                class="text-white leading-relaxed mb-3"
                v-html="formatPreviewText(form.messageText)"
              ></div>
              <div
                v-else
                class="text-gray-500 italic mb-3"
              >
                Введите текст сообщения...
              </div>

              <!-- Button Preview -->
              <div v-if="form.buttonText" class="mt-3">
                <button class="telegram-button">
                  {{ form.buttonText }}
                </button>
              </div>
            </div>

            <!-- Preview Info -->
            <div class="text-xs text-gray-400 mt-3">
              <i class="fas fa-eye mr-1"></i>
              Предварительный просмотр в стиле Telegram
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { obtainStorageFilePutUrl } from '@app/storage'

import { apiPublishToTelegramRoute } from '../api/telegram'

const messageTextarea = ref(null)
const fileInput = ref(null)

const form = ref({
  botToken: '',
  channelId: '',
  messageText: '',
  buttonText: '',
  callbackData: '',
  imageHash: null
})

const errors = ref({})
const successMessage = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)
const selectedFile = ref(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadedImageName = ref('')
const showSuccessModal = ref(false)
const countdown = ref(3)

const isDragging = ref(false)

const activeFormats = ref({
  bold: false,
  italic: false,
  underline: false,
  code: false
})

const maxChars = computed(() => {
  return form.value.imageHash ? 1000 : 4000
})

const charCount = computed(() => {
  return form.value.messageText.length
})

const remainingChars = computed(() => {
  return maxChars.value - charCount.value
})

const previewImage = computed(() => {
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value)
  }
  return null
})

const isFormValid = computed(() => {
  return (
    form.value.botToken.trim() &&
    form.value.channelId.trim() &&
    remainingChars.value >= 0 &&
    (form.value.buttonText ? !!form.value.callbackData : true) &&
    (!!form.value.messageText || !!form.value.imageHash)
  )
})

watch(form.value, (newVal, oldVal) => {
  if (charCount.value > maxChars.value) {
    form.value.messageText = form.value.messageText.substring(0, maxChars.value)
  }
}, { deep: true })

watch(form, () => {
  if (successMessage.value || Object.keys(errors.value).length > 0) {
    errors.value = {}
    successMessage.value = ''
  }
}, { deep: true })

function handleFileSelect(event) {
  const files = event.target.files
  processFile(files)
}

function handleFileDrop(event) {
  isDragging.value = false
  const files = event.dataTransfer.files
  processFile(files)
}

async function processFile(files) {
  errors.value = {}
  successMessage.value = ''
  
  if (files && files.length > 0) {
    const file = files[0]
    selectedFile.value = file
    uploadedImageName.value = file.name
    
    await uploadFileToStorage(file)
  }
}

async function uploadFileToStorage(file) {
  try {
    isUploading.value = true
    uploadProgress.value = 0
    
    const uploadUrl = await obtainStorageFilePutUrl(ctx)
    
    const formData = new FormData()
    formData.append('Filedata', file)
    
    const hash = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          uploadProgress.value = Math.round((e.loaded / e.total) * 100)
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(xhr.responseText)
        } else {
          reject(new Error('Upload failed'))
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })
      
      xhr.open('POST', uploadUrl)
      xhr.send(formData)
    })
    
    form.value.imageHash = hash
    
  } catch (error) {
    console.error('Upload error:', error)
    errors.value.image = 'Ошибка загрузки файла: ' + (error.message || 'Неизвестная ошибка')
    selectedFile.value = null
    uploadedImageName.value = ''
    form.value.imageHash = null
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

function removeImage() {
  selectedFile.value = null
  form.value.imageHash = null
  uploadedImageName.value = ''
  errors.value.image = ''
}

function updateSelection() {
  // optionally update current formatting states
}

function updateCharCount() {
  // reactive computed handles char count
}

function toggleFormat(format) {
  const textarea = messageTextarea.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = form.value.messageText.substring(start, end)

  if (!selectedText) return

  let formattedText = ''
  switch (format) {
    case 'bold':
      formattedText = `**${selectedText}**`
      break
    case 'italic':
      formattedText = `*${selectedText}*`
      break
    case 'underline':
      formattedText = `__${selectedText}__`
      break
    case 'code':
      formattedText = `\`${selectedText}\``
      break
  }

  const newText =
    form.value.messageText.substring(0, start) +
    formattedText +
    form.value.messageText.substring(end)

  form.value.messageText = newText
  setTimeout(() => {
    textarea.setSelectionRange(start, start + formattedText.length)
    textarea.focus()
  }, 0)
}

function insertLink() {
  const textarea = messageTextarea.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = form.value.messageText.substring(start, end)

  const url = prompt('Введите URL ссылки:')
  if (!url) return

  let linkText = selectedText

  if (!linkText.trim()) {
    linkText = prompt('Введите текст ссылки:', url)
    if (!linkText) return
  }

  const formattedLink = `[${linkText}](${url})`

  const newText =
    form.value.messageText.substring(0, start) +
    formattedLink +
    form.value.messageText.substring(end)

  form.value.messageText = newText
  setTimeout(() => {
    textarea.setSelectionRange(start + formattedLink.length, start + formattedLink.length)
    textarea.focus()
  }, 0)
}

function formatPreviewText(text) {
  if (!text) return ''

  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #8774e1;" target="_blank">$1</a>')
    .replace(/\n/g, '<br>')
}

async function submitForm() {
  errors.value = {}
  successMessage.value = ''
  errorMessage.value = ''
  showSuccessModal.value = false

  // Image validation
  if (selectedFile.value) {
    const maxSize = 5 * 1024 * 1024 // 5MB  
    if (selectedFile.value.size > maxSize) {
      errors.value.image = 'Размер изображения не должен превышать 5 МБ'
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']    
    if (!validTypes.includes(selectedFile.value.type)) {
      errors.value.image = 'Поддерживаются только файлы JPG, JPEG и PNG'
      return
    }
  }

  if (!form.value.messageText && !form.value.imageHash) {
    errors.value.messageText = 'Необходимо указать текст сообщения или изображение'
    return
  }

  try {
    isSubmitting.value = true
    
    const requestData = {
      botToken: form.value.botToken,
      channelId: form.value.channelId, 
      messageText: form.value.messageText,
      buttonText: form.value.buttonText,
      callbackData: form.value.callbackData,
      imageHash: form.value.imageHash
    }
    console.log('Sending request:', requestData)

    const result = await apiPublishToTelegramRoute.run(ctx, requestData)

    if (result.success) {
      successMessage.value = result.message || 'Сообщение успешно отправлено!'
      showSuccessModal.value = true
      startCountdown()
      form.value.botToken = ''
      form.value.channelId = ''
      form.value.messageText = ''
      form.value.buttonText = ''
      form.value.callbackData = ''
      form.value.imageHash = null
      selectedFile.value = null
      uploadedImageName.value = ''
    } else {
      if (result.error && result.error.includes('изображение')) {
        errors.value.image = result.error
      } else {
        errorMessage.value = result.error || 'Произошла ошибка при отправке'
      }
    }
  } catch (error) {
    console.error('Submission error:', error)
    errorMessage.value = 'Произошла ошибка при отправке публикации'
  } finally {
    isSubmitting.value = false
  }
}

function startCountdown() {
  countdown.value = 3
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      showSuccessModal.value = false
    }
  }, 1000)
}
</script>

<style scoped>
/* Additional component-specific styles if needed */
</style>
import { Index, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { useThrottleFn } from 'solidjs-use'
import IconClear from './icons/Clear'
import MessageItem from './MessageItem'
import SystemRoleSettings from './SystemRoleSettings'
import ErrorMessageItem from './ErrorMessageItem'
import type { ChatMessage, ErrorMessage } from '@/types'

export default () => {
  let inputRef: HTMLTextAreaElement
  const [currentSystemRoleSettings, setCurrentSystemRoleSettings] = createSignal('')
  const [systemRoleEditing, setSystemRoleEditing] = createSignal(false)
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([])
  const [currentError, setCurrentError] = createSignal<ErrorMessage>()
  const [currentAssistantMessage, setCurrentAssistantMessage] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [controller, setController] = createSignal<AbortController>(null)

  let audio: HTMLAudioElement
  let chunks = [] // 用于存储返回的内容
  let waitingSentence = [] // 待转换的数组
  let convertResult = []
  let converting = false
  let voiceIndex = 0
  let playIndex = 0
  let model = ''
  let speakable = 'off'

  onMount(() => {
    try {
      if (localStorage.getItem('messageList'))
        setMessageList(JSON.parse(localStorage.getItem('messageList')))

      if (localStorage.getItem('systemRoleSettings'))
        setCurrentSystemRoleSettings(localStorage.getItem('systemRoleSettings'))
      
      model = localStorage.getItem('speaker')
      speakable = localStorage.getItem('speakable')  
    } catch (err) {
      console.error(err)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    onCleanup(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })

    audio.addEventListener('canplaythrough', () => {
      audio.play();
    });
    audio.onended = () => {
      const url = convertResult[++playIndex]
      if (url)
        audio.src = url
    }
  })

  const convert = async(text: string, index: number) => {
    const response = await fetch('https://flask.co-pilot.buzz/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        rate: 100,
        model: model + 'Neural'
      })
    });
    const blob = await response.blob();
    convertResult[index] = URL.createObjectURL(blob)
    if(index == 0) {
      audio.src = convertResult[index]
    }
  }

  const speak = async(text: string) => {
    waitingSentence.push(text)
    if (!converting) {
      converting = true;
      startConvert()
    }
  }

  const startConvert = async () => {
    while(true) {
      const text = waitingSentence.shift()
      if(text) {
        convert(text, voiceIndex++)
      } else if(loading()) {
        await Sleep(500)
      } else {
        converting = false;
        break;
      }
    }
  }

  const resetAudio = () => {
    if (!audio.src)
      audio.src = undefined;
    playIndex = 0
    voiceIndex = 0
    waitingSentence = []
    convertResult = []
  }

  const Sleep = (ms)=> {
    return new Promise(resolve=> setTimeout(resolve, ms))
  }

  const handleBeforeUnload = () => {
    localStorage.setItem('messageList', JSON.stringify(messageList()))
    localStorage.setItem('systemRoleSettings', currentSystemRoleSettings())
  }

  const handleButtonClick = async() => {
    const inputValue = inputRef.value
    if (!inputValue)
      return

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (window?.umami) umami.trackEvent('chat_generate')
    inputRef.value = ''
    setMessageList([
      ...messageList(),
      {
        role: 'user',
        content: inputValue,
      },
    ])
    resetAudio()
    requestWithLatestMessage()
  }

  const smoothToBottom = useThrottleFn(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, 300, false, true)

  const requestWithLatestMessage = async() => {
    setLoading(true)
    setCurrentAssistantMessage('')
    setCurrentError(null)
    const userKey = localStorage.getItem('user_key')
    try {
      const controller = new AbortController()
      setController(controller)
      const requestMessageList = [...messageList()]
      if (currentSystemRoleSettings()) {
        requestMessageList.unshift({
          role: 'system',
          content: currentSystemRoleSettings(),
        })
      }
      const response = await fetch('https://chat.co-pilot.top/api/generate', {
        method: 'POST',
        headers: {
          Authorization: userKey
        },
        body: JSON.stringify({
          messages: requestMessageList
        }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const error = await response.json()
        console.error(error.error)
        setCurrentError(error.error)
        throw new Error('Request failed')
      }
      const data = response.body
      if (!data)
        throw new Error('No data')

      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      let optimizeDone = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) {
          let char = decoder.decode(value)
          if (char === '\n' && currentAssistantMessage().endsWith('\n'))
            continue

          if (char.endsWith('[DONE]')) {
            char = char.replaceAll('[DONE]', '')
            optimizeDone = true
          }
          if (char){
            setCurrentAssistantMessage(currentAssistantMessage() + char)

            if (speakable === 'on' && model !== '') {
              chunks.push(char)
              if (char.includes('.')) { // 判断是否遇到句号
                const last = chunks.pop()
                const index = last.indexOf('.')
                chunks.push(last.substring(0, index + 1))
                const text = chunks.join('');
                speak(text)
                chunks = [last.substring(index + 1)]
              }
            }
          }

          smoothToBottom()
        }
        done = readerDone || optimizeDone
      }
      if (speakable === 'on' && model !== '') {
        const text = chunks.join(''); // 将chunks数组中的文本拼接成完整的一段话
        speak(text)
        chunks = []
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
      setController(null)
      return
    }
    archiveCurrentMessage()
  }

  const archiveCurrentMessage = () => {
    if (currentAssistantMessage()) {
      setMessageList([
        ...messageList(),
        {
          role: 'assistant',
          content: currentAssistantMessage(),
        },
      ])
      setCurrentAssistantMessage('')
      setLoading(false)
      setController(null)
      inputRef.focus()
    }
  }

  const clear = () => {
    inputRef.value = ''
    inputRef.style.height = 'auto'
    setMessageList([])
    setCurrentAssistantMessage('')
    setCurrentSystemRoleSettings('')
  }

  const stopStreamFetch = () => {
    if (controller()) {
      controller().abort()
      archiveCurrentMessage()
    }
  }

  const retryLastFetch = () => {
    if (messageList().length > 0) {
      const lastMessage = messageList()[messageList().length - 1]
      if (lastMessage.role === 'assistant')
        setMessageList(messageList().slice(0, -1))

      requestWithLatestMessage()
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey)
      return

    if (e.key === 'Enter')
      handleButtonClick()
  }

  return (
    <div my-6>
      <SystemRoleSettings
        canEdit={() => messageList().length === 0}
        systemRoleEditing={systemRoleEditing}
        setSystemRoleEditing={setSystemRoleEditing}
        currentSystemRoleSettings={currentSystemRoleSettings}
        setCurrentSystemRoleSettings={setCurrentSystemRoleSettings}
      />

      <audio ref={audio} controls={true} style="display:none" />

      <Index each={messageList()}>
        {(message, index) => (
          <MessageItem
            role={message().role}
            message={message().content}
            showRetry={() => (message().role === 'assistant' && index === messageList().length - 1)}
            onRetry={retryLastFetch}
          />
        )}
      </Index>
      {currentAssistantMessage() && (
        <MessageItem
          role="assistant"
          message={currentAssistantMessage}
        />
      )}
      { currentError() && <ErrorMessageItem data={currentError()} onRetry={retryLastFetch} /> }
      <Show
        when={!loading()}
        fallback={() => (
          <div class="gen-cb-wrapper">
            <span>AI is thinking...</span>
            <div class="gen-cb-stop" onClick={stopStreamFetch}>Stop</div>
          </div>
        )}
      >
        <div class="gen-text-wrapper" class:op-50={systemRoleEditing()}>
          <textarea
            ref={inputRef!}
            disabled={systemRoleEditing()}
            onKeyDown={handleKeydown}
            placeholder="Enter something..."
            autocomplete="off"
            autofocus
            onInput={() => {
              inputRef.style.height = 'auto'
              inputRef.style.height = `${inputRef.scrollHeight}px`
            }}
            rows="1"
            class="gen-textarea"
          />
          <button onClick={handleButtonClick} disabled={systemRoleEditing()} gen-slate-btn>
            Send
          </button>
          <button title="Clear" onClick={clear} disabled={systemRoleEditing()} gen-slate-btn>
            <IconClear />
          </button>
        </div>
      </Show>
    </div>
  )
}

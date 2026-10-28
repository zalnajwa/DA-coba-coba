'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../lib/prisma'
import { chatWithAI, getActiveGeminiModelInfo } from '../lib/ai'
import { AiMessage } from '../types'

export async function getGeminiModelStatus() {
  return await getActiveGeminiModelInfo()
}

export async function sendAiMessage(userText: string, source: 'WEB' | 'WHATSAPP' = 'WEB') {
  // 1. Save user message
  await prisma.aiChatHistory.create({
    data: {
      role: 'USER',
      content: userText,
      source,
    },
  })

  // 2. Fetch recent conversation history
  const recentHistory = await prisma.aiChatHistory.findMany({
    where: { source },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const messages: AiMessage[] = recentHistory
    .reverse()
    .map((h) => ({
      role: h.role.toLowerCase() === 'user' ? 'user' : 'assistant',
      content: h.content,
      timestamp: h.createdAt,
    }))

  // 3. Call AI
  const response = await chatWithAI(messages)

  // 4. Save assistant response
  await prisma.aiChatHistory.create({
    data: {
      role: 'ASSISTANT',
      content: response,
      source,
    },
  })

  revalidatePath('/ai-advisor')
  return response
}

export async function getAiHistory(source: 'WEB' | 'WHATSAPP' = 'WEB', limit: number = 50) {
  const history = await prisma.aiChatHistory.findMany({
    where: { source },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  return history.map((h) => ({
    id: h.id,
    role: h.role.toLowerCase() as 'user' | 'assistant',
    content: h.content,
    createdAt: h.createdAt,
  }))
}

export async function clearAiHistory(source: 'WEB' | 'WHATSAPP' = 'WEB') {
  await prisma.aiChatHistory.deleteMany({
    where: { source },
  })
  revalidatePath('/ai-advisor')
}

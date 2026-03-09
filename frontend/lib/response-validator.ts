// CodeFlow AI - Response Validator
// Validates API responses against expected schemas

import { ValidationError } from './error-handler'
import type {
  AuthResponse,
  ProfileAnalysis,
  LearningPath,
  Progress,
  ChatResponse,
  Problem,
  Badge,
} from './api'

/**
 * Validate authentication response
 */
export function validateAuthResponse(data: any): AuthResponse {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid auth response: expected object')
  }

  if (!data.access_token || typeof data.access_token !== 'string') {
    throw new ValidationError('Invalid auth response: missing or invalid access_token', ['access_token'])
  }

  if (!data.refresh_token || typeof data.refresh_token !== 'string') {
    throw new ValidationError('Invalid auth response: missing or invalid refresh_token', ['refresh_token'])
  }

  // User object is optional but if present, validate it
  if (data.user) {
    if (typeof data.user !== 'object') {
      throw new ValidationError('Invalid auth response: user must be an object', ['user'])
    }
    if (!data.user.user_id || typeof data.user.user_id !== 'string') {
      throw new ValidationError('Invalid auth response: user.user_id required', ['user.user_id'])
    }
  }

  return data as AuthResponse
}

/**
 * Validate profile analysis response
 */
export function validateProfileAnalysis(data: any): ProfileAnalysis {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid profile analysis: expected object')
  }

  if (!data.user_id || typeof data.user_id !== 'string') {
    throw new ValidationError('Invalid profile analysis: missing user_id', ['user_id'])
  }

  if (!data.topics || typeof data.topics !== 'object') {
    throw new ValidationError('Invalid profile analysis: missing topics', ['topics'])
  }

  // Validate heatmap structure
  if (!data.heatmap || typeof data.heatmap !== 'object') {
    throw new ValidationError('Invalid profile analysis: missing heatmap', ['heatmap'])
  }

  if (!Array.isArray(data.heatmap.weak)) {
    throw new ValidationError('Invalid profile analysis: heatmap.weak must be array', ['heatmap.weak'])
  }

  if (!Array.isArray(data.heatmap.moderate)) {
    throw new ValidationError('Invalid profile analysis: heatmap.moderate must be array', ['heatmap.moderate'])
  }

  if (!Array.isArray(data.heatmap.strong)) {
    throw new ValidationError('Invalid profile analysis: heatmap.strong must be array', ['heatmap.strong'])
  }

  // Validate summary
  if (!data.summary || typeof data.summary !== 'object') {
    throw new ValidationError('Invalid profile analysis: missing summary', ['summary'])
  }

  return data as ProfileAnalysis
}

/**
 * Validate learning path response
 */
export function validateLearningPath(data: any): LearningPath {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid learning path: expected object')
  }

  if (!data.path_id || typeof data.path_id !== 'string') {
    throw new ValidationError('Invalid learning path: missing path_id', ['path_id'])
  }

  if (!Array.isArray(data.problems)) {
    throw new ValidationError('Invalid learning path: problems must be array', ['problems'])
  }

  // Validate each problem
  data.problems.forEach((problem: any, index: number) => {
    if (!problem.title || typeof problem.title !== 'string') {
      throw new ValidationError(`Invalid learning path: problem[${index}].title required`, [`problems[${index}].title`])
    }
    if (!problem.difficulty || !['Easy', 'Medium', 'Hard'].includes(problem.difficulty)) {
      throw new ValidationError(`Invalid learning path: problem[${index}].difficulty must be Easy/Medium/Hard`, [`problems[${index}].difficulty`])
    }
    if (!Array.isArray(problem.topics)) {
      throw new ValidationError(`Invalid learning path: problem[${index}].topics must be array`, [`problems[${index}].topics`])
    }
  })

  if (typeof data.total_problems !== 'number') {
    throw new ValidationError('Invalid learning path: total_problems must be number', ['total_problems'])
  }

  return data as LearningPath
}

/**
 * Validate progress response
 */
export function validateProgress(data: any): Progress {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid progress: expected object')
  }

  if (!data.user_id || typeof data.user_id !== 'string') {
    throw new ValidationError('Invalid progress: missing user_id', ['user_id'])
  }

  if (typeof data.streak_count !== 'number') {
    throw new ValidationError('Invalid progress: streak_count must be number', ['streak_count'])
  }

  if (!Array.isArray(data.badges)) {
    throw new ValidationError('Invalid progress: badges must be array', ['badges'])
  }

  // Validate each badge
  data.badges.forEach((badge: any, index: number) => {
    if (!badge.badge_id || typeof badge.badge_id !== 'string') {
      throw new ValidationError(`Invalid progress: badge[${index}].badge_id required`, [`badges[${index}].badge_id`])
    }
    if (!badge.name || typeof badge.name !== 'string') {
      throw new ValidationError(`Invalid progress: badge[${index}].name required`, [`badges[${index}].name`])
    }
  })

  if (typeof data.problems_solved_today !== 'number') {
    throw new ValidationError('Invalid progress: problems_solved_today must be number', ['problems_solved_today'])
  }

  if (typeof data.total_problems_solved !== 'number') {
    throw new ValidationError('Invalid progress: total_problems_solved must be number', ['total_problems_solved'])
  }

  return data as Progress
}

/**
 * Validate chat response
 */
export function validateChatResponse(data: any): ChatResponse {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid chat response: expected object')
  }

  if (!data.response || typeof data.response !== 'string') {
    throw new ValidationError('Invalid chat response: missing response text', ['response'])
  }

  if (!data.intent || !['CODE_DEBUGGING', 'CONCEPT_QUESTION', 'HINT_REQUEST', 'GENERAL'].includes(data.intent)) {
    throw new ValidationError('Invalid chat response: invalid intent', ['intent'])
  }

  if (typeof data.cached !== 'boolean') {
    throw new ValidationError('Invalid chat response: cached must be boolean', ['cached'])
  }

  if (!data.model_used || typeof data.model_used !== 'string') {
    throw new ValidationError('Invalid chat response: missing model_used', ['model_used'])
  }

  return data as ChatResponse
}

/**
 * Validate profile fetch response
 */
export function validateProfileFetchResponse(data: any): any {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid profile fetch response: expected object')
  }

  if (!data.user_id || typeof data.user_id !== 'string') {
    throw new ValidationError('Invalid profile fetch response: missing user_id', ['user_id'])
  }

  if (!data.leetcode_username || typeof data.leetcode_username !== 'string') {
    throw new ValidationError('Invalid profile fetch response: missing leetcode_username', ['leetcode_username'])
  }

  return data
}

/**
 * Validate topics response
 */
export function validateTopicsResponse(data: any): any {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid topics response: expected object')
  }

  if (!data.user_id || typeof data.user_id !== 'string') {
    throw new ValidationError('Invalid topics response: missing user_id', ['user_id'])
  }

  if (!data.topics || typeof data.topics !== 'object') {
    throw new ValidationError('Invalid topics response: missing topics', ['topics'])
  }

  return data
}

export type RuleCondition = 'MoreThan' | 'EqualAndMoreThan' | 'LessThan' | 'EqualAndLessThan'

export interface ProviderRule {
  id: number
  providerId: number
  amount: number
  condition: string
  percentage: number
  paymentMethod: string
  createdAt: string
}

export interface Provider {
  id: number
  name: string
  createdAt: string
  rules: ProviderRule[]
}

export interface CreateProviderDto {
  name: string
}

export interface CreateRuleDto {
  amount: number
  condition: string
  percentage: number
  paymentMethod?: string
}


/**
 * Russian text for English API errors users can actually hit. Unknown messages
 * pass through unchanged, so a new backend error is never hidden.
 */
const API_MESSAGES_RU: Record<string, string> = {
  "Access denied": "Нет доступа к этому разделу",
  "Insufficient permissions": "Недостаточно прав для этого действия",
  "Insufficient company permissions": "Недостаточно прав в компании для этого действия",
  "Account cannot sign in with this role":
    "У этого аккаунта нет такой роли. Выберите другую роль или зарегистрируйтесь",
  "Invalid email or password": "Неверная почта или пароль",
  "Invalid password": "Неверный пароль",
  "Email already registered": "Эта почта уже зарегистрирована",
  "Invalid or expired 2FA challenge": "Код подтверждения устарел, войдите ещё раз",
  "Invalid 2FA challenge": "Неверный код подтверждения",
  "Session revoked": "Сессия завершена, войдите ещё раз",
  "Token revoked": "Сессия завершена, войдите ещё раз",
  "Invalid refresh token": "Сессия завершена, войдите ещё раз",
  "User not found": "Пользователь не найден",
  "Company not found": "Компания не найдена",
  "Contract not found": "Сделка не найдена",
  "RFQ not found": "Заявка не найдена",
  "Proposal not found": "Предложение не найдено",
  "Catalog item not found": "Товар не найден",
  "Dispute not found": "Спор не найден",
  "Chat not found": "Чат не найден",
  "Company role required": "Действие доступно только сотрудникам компании",
  "Not a member of this company": "Вы не состоите в этой компании",
  "Milestone must be funded first": "Сначала оплатите этап: деньги будут удерживаться банком",
  "Milestone cannot be funded": "Этот этап сейчас нельзя оплатить",
  "Contract is under dispute": "По сделке открыт спор, действие недоступно",
  "Contract is already closed": "Сделка уже закрыта",
  "Contract does not accept payments in its current status": "Сделку в этом статусе нельзя оплатить",
  "An active dispute already exists for this contract": "По этой сделке уже открыт спор",
  "Dispute is already resolved": "Спор уже решён",
  "RFQ is not accepting proposals": "Заявка больше не принимает предложения",
  "RFQ already has a contract": "По заявке уже заключена сделка",
  "Proposal already finalized": "Предложение уже рассмотрено",
  "Review already exists": "Вы уже оставили отзыв",
  "Message cannot be empty": "Сообщение не может быть пустым",
  "Message text or file is required": "Напишите сообщение или приложите файл",
  "Cannot chat with yourself": "Нельзя написать самому себе",
  "Cannot report your own catalog item": "Нельзя пожаловаться на свой товар",
  "Ticket is closed": "Обращение закрыто",
  "Ticket already closed": "Обращение уже закрыто",
  "Reason is required for this action": "Укажите причину",
  "Mock payments are disabled while Alif is enabled": "Тестовая оплата отключена: подключён Alif",
}

export const translateApiMessage = (message: string): string =>
  API_MESSAGES_RU[message.trim()] ?? message

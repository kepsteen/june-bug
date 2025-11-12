import { useQuery, useMutation } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import {
  AddTodoForm,
  TodoListContainer,
  TodoCompleteButton,
  TodoEmptyState,
  TodoItem,
  TodoList as TodoListComponent,
  TodoRemoveButton,
  TodoText,
} from '@/components/server'

export const TodoList = () => {
  const { data: todos = [] } = useQuery(convexQuery(api.todos.get, {}))
  const { mutateAsync: create } = useMutation({
    mutationFn: useConvexMutation(api.todos.create),
  })
  const { mutateAsync: toggle } = useMutation({
    mutationFn: useConvexMutation(api.todos.toggle),
  })
  const { mutateAsync: remove } = useMutation({
    mutationFn: useConvexMutation(api.todos.remove),
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const newTodo = formData.get('text') as string
    await create({ text: newTodo.trim() })
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <TodoListContainer>
      <AddTodoForm onSubmit={handleSubmit} />
      <TodoListComponent>
        {todos.map((todo) => (
          <TodoItem key={todo._id}>
            <TodoCompleteButton
              completed={todo.completed}
              onClick={() => toggle({ id: todo._id })}
            />
            <TodoText text={todo.text} completed={todo.completed} />
            <TodoRemoveButton onClick={() => remove({ id: todo._id })} />
          </TodoItem>
        ))}
      </TodoListComponent>
      {todos.length === 0 && <TodoEmptyState />}
    </TodoListContainer>
  )
}

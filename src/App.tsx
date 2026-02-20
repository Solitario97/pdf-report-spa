import { useEffect, useMemo, useState } from "react"
import { fetchUsers } from "./api/users"
import type { User } from "./types/user"
import UsersTable from "./components/UsersTable"
import "./App.css"

type Theme = "light" | "dark"

const DEFAULT_API = "https://jsonplaceholder.typicode.com/users"

function App() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [query, setQuery] = useState("")
    const [apiUrl, setApiUrl] = useState(DEFAULT_API)
    const [inputApiUrl, setInputApiUrl] = useState(DEFAULT_API)

    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem("theme") as Theme) || "light"
    })

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme)
        localStorage.setItem("theme", theme)
    }, [theme])

    const loadUsers = (url: string) => {
        const controller = new AbortController()
        setLoading(true)
        setError(null)

        fetchUsers(controller.signal, url)
            .then(setUsers)
            .catch((e) => {
                if (e.name !== "AbortError") {
                    setError("Не удалось загрузить данные по указанному API.")
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }

    useEffect(() => {
        loadUsers(apiUrl)
    }, [apiUrl])

    const filtered = useMemo(() => {
        if (!Array.isArray(users)) return []
        return users.filter(u =>
            u.name.toLowerCase().includes(query.toLowerCase())
        )
    }, [users, query])

    return (
        <div className="app-container">
            <header className="app-header">
                <div>
                    <h1 className="app-title">Отчёт по пользователям</h1>
                    <p className="app-subtitle">
                        Список пользователей с фильтрацией и экспортом в PDF
                    </p>
                </div>

                <div className="header-controls">
                    <input
                        className="search-input"
                        placeholder="Поиск по имени..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <button
                        className="theme-toggle"
                        onClick={() => setTheme(t => (t === "light" ? "dark" : "light"))}
                        title="Переключить тему"
                    >
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>
                </div>
            </header>

            {/* 🔽 Новый блок для API */}
            <div className="api-controls">
                <input
                    className="api-input"
                    placeholder="Вставьте URL API..."
                    value={inputApiUrl}
                    onChange={(e) => setInputApiUrl(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            setApiUrl(inputApiUrl)
                        }
                    }}
                />

                <button
                    className="api-button"
                    onClick={() => setApiUrl(inputApiUrl)}
                >
                    Обновить данные
                </button>
            </div>

            {loading && <div className="state-info">Загрузка данных…</div>}
            {error && <div className="state-error">{error}</div>}

            {!loading && !error && (
                <UsersTable users={filtered} />
            )}
        </div>
    )
}

export default App
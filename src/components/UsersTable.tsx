import { useMemo, useState } from "react"
import type { User } from "../types/user"
import { exportUsersToPdf, type PdfColumnKey } from "../pdf/exportUsersToPdf"
import "./UsersTable.css"

type SortKey = "name" | "email" | "phone" | "company"

const ALL_COLUMNS: { key: PdfColumnKey; label: string }[] = [
    { key: "name", label: "Имя" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Телефон" },
    { key: "company", label: "Компания" },
]

const PAGE_SIZE = 5

export default function UsersTable({ users }: { users: User[] }) {
    const [sortKey, setSortKey] = useState<SortKey>("name")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
    const [selectedCols, setSelectedCols] = useState<PdfColumnKey[]>(
        ALL_COLUMNS.map(c => c.key)
    )
    const [page, setPage] = useState(1)

    const sortedUsers = useMemo(() => {
        const copy = [...users]
        copy.sort((a, b) => {
            const av =
                sortKey === "company" ? a.company.name.toLowerCase() : String(a[sortKey]).toLowerCase()
            const bv =
                sortKey === "company" ? b.company.name.toLowerCase() : String(b[sortKey]).toLowerCase()

            if (av < bv) return sortDir === "asc" ? -1 : 1
            if (av > bv) return sortDir === "asc" ? 1 : -1
            return 0
        })
        return copy
    }, [users, sortKey, sortDir])

    const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE)

    const pagedUsers = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return sortedUsers.slice(start, start + PAGE_SIZE)
    }, [sortedUsers, page])

    const toggleSort = (key: SortKey) => {
        setPage(1) // сброс страницы при смене сортировки
        if (sortKey === key) {
            setSortDir(d => (d === "asc" ? "desc" : "asc"))
        } else {
            setSortKey(key)
            setSortDir("asc")
        }
    }

    const sortIcon = (key: SortKey) => {
        if (sortKey !== key) return "↕"
        return sortDir === "asc" ? "↑" : "↓"
    }

    const toggleCol = (key: PdfColumnKey) => {
        setSelectedCols(cols =>
            cols.includes(key)
                ? cols.filter(c => c !== key)
                : [...cols, key]
        )
    }

    return (
        <div className="users-card">
            <div className="users-toolbar">
                <div className="users-count">
                    Пользователи: {sortedUsers.length}
                </div>

                <button
                    onClick={async () => {
                        await exportUsersToPdf(sortedUsers, selectedCols)
                    }}
                    className="btn-primary"
                >
                    Скачать PDF
                </button>
            </div>

            {/* Выбор колонок */}
            <div className="pdf-columns">
                {ALL_COLUMNS.map(c => (
                    <label key={c.key} className="pdf-col-option">
                        <input
                            type="checkbox"
                            checked={selectedCols.includes(c.key)}
                            onChange={() => toggleCol(c.key)}
                        />
                        <span>{c.label}</span>
                    </label>
                ))}
            </div>

            {/* Таблица */}
            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th onClick={() => toggleSort("name")}>Имя {sortIcon("name")}</th>
                            <th onClick={() => toggleSort("email")}>Email {sortIcon("email")}</th>
                            <th onClick={() => toggleSort("phone")}>Телефон {sortIcon("phone")}</th>
                            <th onClick={() => toggleSort("company")}>Компания {sortIcon("company")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedUsers.map((u, idx) => (
                            <tr key={u.id} className={idx % 2 === 0 ? "even" : "odd"}>
                                <td className="name">{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.phone}</td>
                                <td>{u.company.name}</td>
                            </tr>
                        ))}

                        {pagedUsers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="empty">
                                    Ничего не найдено
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ← Назад
                    </button>

                    <span>
            Страница {page} из {totalPages}
          </span>

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Вперёд →
                    </button>
                </div>
            )}
        </div>
    )
}
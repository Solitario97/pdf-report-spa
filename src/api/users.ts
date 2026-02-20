// src/api/users.ts
import type { User } from "../types/user"

export async function fetchUsers(
    signal?: AbortSignal,
    apiUrl: string = "https://jsonplaceholder.typicode.com/users"
): Promise<User[]> {
    const res = await fetch(apiUrl, { signal })
    if (!res.ok) throw new Error("Failed to fetch users")

    const data = await res.json()

    // jsonplaceholder
    if (Array.isArray(data)) {
        return data
    }

    // dummyjson
    if (data?.users && Array.isArray(data.users)) {
        return data.users.map((u: any) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            phone: u.phone,
            company: { name: u.company?.name || "—" },
        }))
    }

    throw new Error("Неподдерживаемый формат API")
}
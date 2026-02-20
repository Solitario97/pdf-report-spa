import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { User } from "../types/user"

export type PdfColumnKey = "name" | "email" | "phone" | "company"

const COLUMN_LABELS: Record<PdfColumnKey, string> = {
    name: "Имя",
    email: "Email",
    phone: "Телефон",
    company: "Компания",
}

async function loadImageBase64(url: string): Promise<string | null> {
    try {
        const res = await fetch(url)
        if (!res.ok) return null
        const blob = await res.blob()

        return await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

async function loadFontBase64(url: string): Promise<string> {
    const res = await fetch(url)
    const blob = await res.blob()

    return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            const base64 = result.split(",")[1] // 🔴 ВАЖНО: убираем data:...,
            resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

export async function exportUsersToPdf(
    users: User[],
    columns: PdfColumnKey[]
) {
    try {
        console.log("Export PDF:", { users, columns })

        const doc = new jsPDF()
        const base = import.meta.env.BASE_URL


        const fontBase64 = await loadFontBase64(`${base}fonts/DejaVuSans.ttf`)
        doc.addFileToVFS("DejaVuSans.ttf", fontBase64)
        doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal")
        doc.addFont("DejaVuSans.ttf", "DejaVuSans", "bold")
        doc.setFont("DejaVuSans", "normal")

        const title = "Отчёт по пользователям"
        const date = new Date().toLocaleDateString()

        const logoBase64 = await loadImageBase64(`${base}logoAmir.png`)

        if (logoBase64) {
            doc.addImage(logoBase64, "PNG", 14, 10, 20, 20)
        }

        doc.setFontSize(16)
        doc.text(title, 40, 18)

        doc.setFontSize(10)
        doc.text(`Дата формирования: ${date}`, 40, 25)

        doc.setDrawColor(200)
        doc.line(14, 32, 196, 32)

        const head = [columns.map(c => COLUMN_LABELS[c])]

        const body = users.map(u =>
            columns.map(c => {
                switch (c) {
                    case "name":
                        return u.name
                    case "email":
                        return u.email
                    case "phone":
                        return u.phone
                    case "company":
                        return u.company.name
                }
            })
        )

        autoTable(doc, {
            startY: 38,
            head,
            body,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: {
                fillColor: [99, 102, 241],
                textColor: 255,
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
                data.cell.styles.font = "DejaVuSans"
            },
        })

        doc.save(`users-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
        console.error("Ошибка при генерации PDF:", e)
        alert("Ошибка при генерации PDF. Смотри консоль.")
    }
}
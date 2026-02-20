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

async function loadBinary(url: string): Promise<string> {
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    let binary = ""
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
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

export async function exportUsersToPdf(users: User[], columns: PdfColumnKey[]) {
    try {
        const doc = new jsPDF()
        const base = import.meta.env.BASE_URL

        // ⬇️ ПРАВИЛЬНАЯ загрузка шрифта
        const fontBinary = await loadBinary(`${base}fonts/DejaVuSans.ttf`)
        doc.addFileToVFS("DejaVuSans.ttf", fontBinary)
        doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal")
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
                    case "name": return u.name
                    case "email": return u.email
                    case "phone": return u.phone
                    case "company": return u.company.name
                }
            })
        )

        autoTable(doc, {
            startY: 38,
            head,
            body,
            styles: {
                font: "DejaVuSans",
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [99, 102, 241],
                textColor: 255,
                font: "DejaVuSans",
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            margin: { left: 14, right: 14 },
        })

        doc.save(`users-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
        console.error("Ошибка при генерации PDF:", e)
        alert("Ошибка при генерации PDF. Смотри консоль.")
    }
}
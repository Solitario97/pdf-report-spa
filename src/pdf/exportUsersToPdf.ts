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
    const res = await fetch(url, { cache: "no-store" })
    const ct = res.headers.get("content-type") || ""
    const buf = await res.arrayBuffer()

    // 🔥 Диагностика: если пришел HTML, это видно сразу
    if (ct.includes("text/html")) {
        const text = new TextDecoder().decode(buf.slice(0, 200))
        throw new Error(`Font URL returned HTML: ${url}\nContent-Type: ${ct}\nPreview: ${text}`)
    }

    const bytes = new Uint8Array(buf)
    let binary = ""
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return btoa(binary)
}



async function loadImageBase64(url: string): Promise<string | null> {
    const res = await fetch(url, { cache: "no-store" }) // ВАЖНО
    if (!res.ok) return null
    const blob = await res.blob()

    return await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
    })
}

export async function exportUsersToPdf(users: User[], columns: PdfColumnKey[]) {
    try {
        // ❗ ВАЖНО: создаём jsPDF с явными параметрами
        const doc = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4",
            putOnlyUsedFonts: true,   // 🔥 важно
            compress: true,
        })
        const base = import.meta.env.BASE_URL

        // Шрифт
        const fontUrl = new URL("../assets/fonts/Roboto-Regular.ttf", import.meta.url).toString()
        const fontBinary = await loadBinary(fontUrl)

        doc.addFileToVFS("Roboto-Regular.ttf", fontBinary)
        doc.addFont("Roboto-Regular.ttf", "Roboto", "normal", "Identity-H")
        doc.setFont("Roboto", "normal")

        doc.setFontSize(12)

        // Шапка
        const title = "Отчёт по пользователям"
        const date = new Date().toLocaleDateString("ru-RU")

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
            styles: { font: "Roboto", fontStyle: "normal" },
            headStyles: { font: "Roboto", fontStyle: "normal" },
            bodyStyles: { font: "Roboto", fontStyle: "normal" },
        })

        doc.save(`users-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
        console.error("Ошибка при генерации PDF:", e)
        alert("Ошибка при генерации PDF. Смотри консоль.")
    }
}
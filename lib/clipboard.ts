export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Alguns navegadores bloqueiam a API moderna mesmo em páginas HTTPS.
  }

  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.setAttribute("readonly", "")
  textArea.style.position = "fixed"
  textArea.style.opacity = "0"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  textArea.setSelectionRange(0, textArea.value.length)

  try {
    return typeof document.execCommand === "function" && document.execCommand("copy")
  } catch {
    return false
  } finally {
    document.body.removeChild(textArea)
  }
}

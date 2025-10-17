;(() => {
    const folderInput = document.getElementById('folderInput')
    const filesInput = document.getElementById('filesInput')
    const gallery = document.getElementById('gallery')
    const dropZone = document.getElementById('dropZone')
    const searchInput = document.getElementById('searchInput')
    const clearBtn = document.getElementById('clearBtn')
    const countEl = document.getElementById('count')

    /** @type {{ file: File, url: string, name: string, path: string, size: number }[]} */
    let images = []

    function isLikelyImageByName(name) {
        const lower = name.toLowerCase()
        return (
            lower.endsWith('.png') ||
            lower.endsWith('.jpg') ||
            lower.endsWith('.jpeg') ||
            lower.endsWith('.gif') ||
            lower.endsWith('.webp') ||
            lower.endsWith('.bmp') ||
            lower.endsWith('.avif') ||
            lower.endsWith('.tif') ||
            lower.endsWith('.tiff') ||
            lower.endsWith('.svg')
        )
    }

    function extFromMime(mime) {
        switch ((mime || '').toLowerCase()) {
            case 'image/png':
                return '.png'
            case 'image/jpeg':
                return '.jpg'
            case 'image/gif':
                return '.gif'
            case 'image/webp':
                return '.webp'
            case 'image/bmp':
                return '.bmp'
            case 'image/avif':
                return '.avif'
            case 'image/svg+xml':
                return '.svg'
            default:
                return ''
        }
    }

    function replaceOrAppendExt(name, ext) {
        const dot = name.lastIndexOf('.')
        const base = dot > 0 ? name.slice(0, dot) : name
        return `${base}${ext}`
    }

    async function isImageByMagicBytes(file) {
        const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        const png =
            header[0] === 0x89 &&
            header[1] === 0x50 &&
            header[2] === 0x4e &&
            header[3] === 0x47
        // JPG: FF D8
        const jpg = header[0] === 0xff && header[1] === 0xd8
        // GIF: 47 49 46 38
        const gif =
            header[0] === 0x47 &&
            header[1] === 0x49 &&
            header[2] === 0x46 &&
            header[3] === 0x38
        // WEBP: RIFF .... WEBP
        const riff =
            header[0] === 0x52 &&
            header[1] === 0x49 &&
            header[2] === 0x46 &&
            header[3] === 0x46
        const webp =
            riff &&
            header[8] === 0x57 &&
            header[9] === 0x45 &&
            header[10] === 0x42 &&
            header[11] === 0x50
        // BMP: 42 4D
        const bmp = header[0] === 0x42 && header[1] === 0x4d
        // AVIF/HEIF/HEIC: ftyp....avif/heic/heix
        const ftyp =
            header[4] === 0x66 &&
            header[5] === 0x74 &&
            header[6] === 0x79 &&
            header[7] === 0x70
        const avif =
            ftyp &&
            header.slice(8, 12).toString() ===
                new TextEncoder().encode('avif').toString()
        return png || jpg || gif || webp || bmp || avif
    }

    async function suggestedImageExt(file) {
        // Try MIME first
        const byMime = extFromMime(file.type)
        if (byMime) return byMime
        // Try header
        try {
            const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
            // duplicate simple checks here to keep logic local
            if (
                header[0] === 0x89 &&
                header[1] === 0x50 &&
                header[2] === 0x4e &&
                header[3] === 0x47
            )
                return '.png'
            if (header[0] === 0xff && header[1] === 0xd8) return '.jpg'
            if (
                header[0] === 0x47 &&
                header[1] === 0x49 &&
                header[2] === 0x46 &&
                header[3] === 0x38
            )
                return '.gif'
            if (
                header[0] === 0x52 &&
                header[1] === 0x49 &&
                header[2] === 0x46 &&
                header[3] === 0x46 &&
                header[8] === 0x57 &&
                header[9] === 0x45 &&
                header[10] === 0x42 &&
                header[11] === 0x50
            )
                return '.webp'
            if (header[0] === 0x42 && header[1] === 0x4d) return '.bmp'
            const ftyp =
                header[4] === 0x66 &&
                header[5] === 0x74 &&
                header[6] === 0x79 &&
                header[7] === 0x70
            if (ftyp) return '.avif'
        } catch (_) {}
        return '.png'
    }

    async function isRenderableImage(file) {
        if (file.type && file.type.startsWith('image/')) return true
        if (isLikelyImageByName(file.name)) return true
        try {
            if (await isImageByMagicBytes(file)) return true
        } catch (_) {}
        // Fallback: try to decode by creating an Image
        try {
            const url = URL.createObjectURL(file)
            await new Promise((resolve, reject) => {
                const img = new Image()
                img.onload = () => {
                    URL.revokeObjectURL(url)
                    resolve()
                }
                img.onerror = (e) => {
                    URL.revokeObjectURL(url)
                    reject(e)
                }
                img.src = url
            })
            return true
        } catch (_) {
            return false
        }
    }

    function revokeAll() {
        for (const item of images) URL.revokeObjectURL(item.url)
    }

    function formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB']
        let i = 0
        let n = bytes
        while (n >= 1024 && i < units.length - 1) {
            n /= 1024
            i++
        }
        return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
    }

    async function addFiles(fileList) {
        const next = []
        for (const file of fileList) {
            // Detect images even if MIME type is empty or incorrect
            // eslint-disable-next-line no-await-in-loop
            const ok = await isRenderableImage(file)
            if (!ok) continue
            const url = URL.createObjectURL(file)
            const originalName = file.name || 'image'
            let downloadName = originalName
            if (!isLikelyImageByName(originalName)) {
                // eslint-disable-next-line no-await-in-loop
                const ext = await suggestedImageExt(file)
                downloadName = replaceOrAppendExt(originalName, ext)
            }
            next.push({
                file,
                url,
                name: originalName || 'unnamed',
                path: file.webkitRelativePath || originalName || 'unnamed',
                size: file.size,
                downloadName,
            })
        }
        if (next.length === 0) return
        images = images
            .concat(next)
            .sort((a, b) => a.path.localeCompare(b.path))
        render()
    }

    function render() {
        const q = searchInput.value.trim().toLowerCase()
        const list = q
            ? images.filter(
                  (x) =>
                      x.name.toLowerCase().includes(q) ||
                      x.path.toLowerCase().includes(q)
              )
            : images
        gallery.textContent = ''
        for (const item of list) {
            const card = document.createElement('article')
            card.className = 'card'

            const img = document.createElement('img')
            img.className = 'thumb'
            img.loading = 'lazy'
            img.decoding = 'async'
            img.alt = item.path
            img.src = item.url

            const meta = document.createElement('div')
            meta.className = 'meta'
            const name = document.createElement('span')
            name.className = 'name'
            name.title = item.name
            name.textContent = item.name
            const path = document.createElement('span')
            path.className = 'path'
            path.title = item.path
            path.textContent = `${item.path} • ${formatBytes(item.size)}`

            meta.appendChild(name)
            meta.appendChild(path)
            card.appendChild(img)
            card.appendChild(meta)
            // Actions: download
            const actions = document.createElement('div')
            actions.className = 'actions'
            const download = document.createElement('a')
            download.className = 'button'
            download.textContent = 'Download'
            download.href = item.url
            // Suggest a filename with proper extension
            download.download = item.downloadName || item.name || 'image'
            actions.appendChild(download)
            card.appendChild(actions)
            gallery.appendChild(card)
        }
        countEl.textContent = `${list.length} image${
            list.length === 1 ? '' : 's'
        }`
    }

    function clearAll() {
        revokeAll()
        images = []
        gallery.textContent = ''
        countEl.textContent = '0 images'
    }

    // Events
    folderInput.addEventListener('change', (e) => addFiles(e.target.files))
    filesInput.addEventListener('change', (e) => addFiles(e.target.files))
    searchInput.addEventListener('input', render)
    clearBtn.addEventListener('click', clearAll)

    // Drag-and-drop support for files (folders may not be supported in all browsers)
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault()
        dropZone.classList.add('dragover')
    })
    dropZone.addEventListener('dragleave', () =>
        dropZone.classList.remove('dragover')
    )
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault()
        dropZone.classList.remove('dragover')
        if (e.dataTransfer && e.dataTransfer.files) {
            addFiles(e.dataTransfer.files)
        }
    })

    // Memory cleanup on page close
    window.addEventListener('beforeunload', revokeAll)
})()

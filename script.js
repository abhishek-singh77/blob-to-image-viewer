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

    function isImage(file) {
        return file.type.startsWith('image/')
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

    function addFiles(fileList) {
        const next = []
        for (const file of fileList) {
            if (!isImage(file)) continue
            const url = URL.createObjectURL(file)
            next.push({
                file,
                url,
                name: file.name,
                path: file.webkitRelativePath || file.name,
                size: file.size,
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

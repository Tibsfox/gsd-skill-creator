/**
 * Upload zone renderer for the GSD Dashboard.
 *
 * Produces a drag-and-drop file upload zone that accepts .md and .txt files,
 * reads them client-side via the FileReader API, and extracts document
 * metadata (title, word count, section headings, line count).
 *
 * @module dashboard/upload-zone
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentMetadata {
  title: string;
  wordCount: number;
  sections: string[];
  lineCount: number;
}

// ---------------------------------------------------------------------------
// Metadata Extraction (server-side utility, also embedded client-side)
// ---------------------------------------------------------------------------

/**
 * Parse markdown content and extract document metadata.
 *
 * - **title**: First `# Heading` (not `##`). Empty string if none found.
 * - **wordCount**: Total words across all lines (heading markers excluded).
 * - **sections**: All `##` through `####` heading texts (without `#` markers).
 * - **lineCount**: Total number of lines.
 *
 * @param content - Raw markdown/text content.
 * @returns Extracted metadata.
 */
export function extractDocumentMetadata(content: string): DocumentMetadata {
  if (content === '') {
    return { title: '', wordCount: 0, sections: [], lineCount: 0 };
  }

  const lines = content.split('\n');
  const lineCount = lines.length;

  let title = '';
  const sections: string[] = [];
  let totalWords = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match title: exactly one # followed by space
    const titleMatch = trimmed.match(/^#\s+(.+)$/);
    if (titleMatch && !title) {
      // Only first # heading is the title (not ## or more)
      // Check it's not ## by ensuring the original starts with exactly '# '
      if (/^#[^#]/.test(trimmed)) {
        title = titleMatch[1].trim();
      }
    }

    // Match sections: ## through ####
    const sectionMatch = trimmed.match(/^#{2,4}\s+(.+)$/);
    if (sectionMatch) {
      sections.push(sectionMatch[1].trim());
    }

    // Count words: strip heading markers, then split on whitespace
    let textLine = trimmed;
    const headingPrefixMatch = trimmed.match(/^#{1,6}\s+(.*)$/);
    if (headingPrefixMatch) {
      textLine = headingPrefixMatch[1];
    }

    if (textLine) {
      const words = textLine.split(/\s+/).filter((w) => w.length > 0);
      totalWords += words.length;
    }
  }

  return { title, wordCount: totalWords, sections, lineCount };
}

// ---------------------------------------------------------------------------
// Upload Zone Renderer
// ---------------------------------------------------------------------------

/**
 * Render the upload zone HTML with drag-and-drop, click-to-browse,
 * FileReader integration, and metadata display.
 *
 * @returns HTML string for the upload zone component.
 */
export function renderUploadZone(): string {
  return `<div class="upload-zone" id="upload-zone">
  <div class="upload-zone-prompt">
    <div class="upload-zone-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9 15 12 12 15 15"/>
      </svg>
    </div>
    <div class="upload-zone-text">Drop .md or .txt file here</div>
    <div class="upload-zone-or">or</div>
    <label class="upload-zone-browse" for="upload-file-input">Browse files</label>
    <input type="file" id="upload-file-input" accept=".md,.txt" style="display:none" />
  </div>
  <div class="upload-metadata" style="display:none">
    <div class="upload-metadata-title"></div>
    <div class="upload-metadata-stats"></div>
    <div class="upload-metadata-sections"></div>
  </div>
</div>
<script>
(function() {
  var zone = document.getElementById('upload-zone');
  var input = document.getElementById('upload-file-input');
  var metaDiv = document.querySelector('.upload-metadata');

  function extractMetadata(content) {
    if (!content) return { title: '', wordCount: 0, sections: [], lineCount: 0 };
    var lines = content.split('\\n');
    var lineCount = lines.length;
    var title = '';
    var sections = [];
    var totalWords = 0;
    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].trim();
      var titleMatch = trimmed.match(/^#\\s+(.+)$/);
      if (titleMatch && !title && /^#[^#]/.test(trimmed)) {
        title = titleMatch[1].trim();
      }
      var sectionMatch = trimmed.match(/^#{2,4}\\s+(.+)$/);
      if (sectionMatch) sections.push(sectionMatch[1].trim());
      var textLine = trimmed;
      var hMatch = trimmed.match(/^#{1,6}\\s+(.*)$/);
      if (hMatch) textLine = hMatch[1];
      if (textLine) {
        var words = textLine.split(/\\s+/).filter(function(w) { return w.length > 0; });
        totalWords += words.length;
      }
    }
    return { title: title, wordCount: totalWords, sections: sections, lineCount: lineCount };
  }

  function handleFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var content = e.target.result;
      var meta = extractMetadata(content);
      metaDiv.querySelector('.upload-metadata-title').textContent = meta.title || file.name;
      metaDiv.querySelector('.upload-metadata-stats').textContent =
        meta.wordCount + ' words, ' + meta.lineCount + ' lines';
      var sectionsHtml = meta.sections.map(function(s) {
        return '<li>' + s + '</li>';
      }).join('');
      metaDiv.querySelector('.upload-metadata-sections').innerHTML =
        sectionsHtml ? '<ul>' + sectionsHtml + '</ul>' : 'No sections found';
      metaDiv.style.display = 'block';
      zone.dataset.fileContent = content;
      zone.dataset.fileName = file.name;
    };
    reader.readAsText(file);
  }

  zone.addEventListener('dragover', function(e) {
    e.preventDefault();
    zone.classList.add('upload-zone-active');
  });
  zone.addEventListener('dragleave', function() {
    zone.classList.remove('upload-zone-active');
  });
  zone.addEventListener('drop', function(e) {
    e.preventDefault();
    zone.classList.remove('upload-zone-active');
    var files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });
  input.addEventListener('change', function() {
    if (input.files.length > 0) handleFile(input.files[0]);
  });
})();
</script>`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/**
 * Return CSS styles for the upload zone component.
 *
 * Uses CSS custom properties from the dashboard dark theme
 * (defined in the parent page's `:root` block) so the component
 * inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderUploadZoneStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Upload Zone
   ----------------------------------------------------------------------- */

.upload-zone {
  background: var(--surface);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: var(--space-md);
}

.upload-zone:hover {
  border-color: var(--accent);
}

.upload-zone-active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
}

.upload-zone-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-muted);
}

.upload-zone-icon {
  color: var(--text-dim);
  margin-bottom: var(--space-sm);
}

.upload-zone-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text);
}

.upload-zone-or {
  font-size: 0.85rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.upload-zone-browse {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  background: var(--accent);
  color: var(--bg);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.upload-zone-browse:hover {
  opacity: 0.85;
}

.upload-metadata {
  margin-top: var(--space-lg);
  padding: var(--space-md);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: left;
}

.upload-metadata-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-sm);
}

.upload-metadata-stats {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-bottom: var(--space-sm);
}

.upload-metadata-sections {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.upload-metadata-sections ul {
  list-style: none;
  padding: 0;
  margin: var(--space-xs) 0 0 0;
}

.upload-metadata-sections li {
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--border);
}

.upload-metadata-sections li:last-child {
  border-bottom: none;
}
`;
}

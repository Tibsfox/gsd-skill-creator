/**
 * Manifest patching utilities shared by ProposalDryRunner and ResolverOrchestrator.
 *
 * Uses simple text substitution to preserve formatting and comments.
 * Throws when the target package is not found in the manifest.
 */

import type { ChangeType } from './types.js';
import type { Ecosystem } from '../dependency-auditor/types.js';

/**
 * Escape every regex metacharacter so package names containing `.`, `+`, `*`,
 * `(`, etc. (legal in cargo/conda/gem/pypi) are matched literally rather than
 * as patterns. Without this, a package literally named "lib*" or "foo.bar"
 * either silently mis-matches sibling packages or fails to match at all.
 */
function escapeRegExp(s: string): string {
  return s.replace(/[\\^$.*+?()[\]{}|/-]/g, '\\$&');
}

export function patchManifest(
  content: string,
  packageName: string,
  proposedVersion: string,
  changeType: ChangeType,
  ecosystem: Ecosystem,
): string {
  if (changeType === 'remove') {
    return removePackageFromManifest(content, packageName, ecosystem);
  }

  const escapedName = escapeRegExp(packageName);

  switch (ecosystem) {
    case 'npm': {
      const re = new RegExp(`("${escapedName}"\\s*:\\s*)"[^"]*"`, 'g');
      const patched = content.replace(re, `$1"${proposedVersion}"`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in npm manifest`);
      }
      return patched;
    }

    case 'cargo': {
      const re = new RegExp(`(${escapedName}\\s*=\\s*(?:\\{[^}]*version\\s*=\\s*|"))[^"]*("?)`, 'g');
      const patched = content.replace(re, `$1${proposedVersion}$2`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in Cargo.toml`);
      }
      return patched;
    }

    case 'pypi': {
      // PyPI normalization: '-', '_', '.' are interchangeable per PEP 503.
      // Match any single separator at each position by replacing the
      // already-escaped variants with a [-_.] character class.
      const normalized = escapedName.replace(/\\[-_.]/g, '[-_.]');
      const re = new RegExp(`(${normalized})[>=<~!]+[\\d.*]+`, 'gi');
      const patched = content.replace(re, `$1==${proposedVersion}`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in requirements.txt`);
      }
      return patched;
    }

    case 'rubygems': {
      const re = new RegExp(`(gem\\s+['"]${escapedName}['"]\\s*,\\s*['"])[^'"]*(['"])`, 'g');
      const patched = content.replace(re, `$1${proposedVersion}$2`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in Gemfile`);
      }
      return patched;
    }

    case 'conda': {
      const re = new RegExp(`(- ${escapedName}=)[^\\n]*`, 'g');
      const patched = content.replace(re, `$1${proposedVersion}`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in environment.yml`);
      }
      return patched;
    }
  }
}

function removePackageFromManifest(
  content: string,
  packageName: string,
  ecosystem: Ecosystem,
): string {
  const escapedName = escapeRegExp(packageName);

  switch (ecosystem) {
    case 'npm': {
      return content.replace(new RegExp(`\\s*"${escapedName}"\\s*:\\s*"[^"]*",?`, 'g'), '');
    }
    case 'pypi': {
      const normalized = escapedName.replace(/\\[-_.]/g, '[-_.]');
      return content.replace(new RegExp(`^${normalized}[^\\n]*\\n?`, 'gim'), '');
    }
    case 'cargo': {
      return content.replace(new RegExp(`^${escapedName}\\s*=.*\\n?`, 'gm'), '');
    }
    case 'rubygems': {
      return content.replace(new RegExp(`^\\s*gem\\s+['"]${escapedName}['"][^\\n]*\\n?`, 'gm'), '');
    }
    case 'conda': {
      return content.replace(new RegExp(`^\\s*-\\s*${escapedName}[^\\n]*\\n?`, 'gm'), '');
    }
  }
}

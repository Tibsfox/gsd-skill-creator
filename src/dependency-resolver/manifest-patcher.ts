/**
 * Manifest patching utilities shared by ProposalDryRunner and ResolverOrchestrator.
 *
 * Uses simple text substitution to preserve formatting and comments.
 * Throws when the target package is not found in the manifest.
 */

import type { ChangeType } from './types.js';
import type { Ecosystem } from '../dependency-auditor/types.js';

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

  switch (ecosystem) {
    case 'npm': {
      const escapedName = packageName.replace(/[@/]/g, (c) => `\\${c}`);
      const re = new RegExp(`("${escapedName}"\\s*:\\s*)"[^"]*"`, 'g');
      const patched = content.replace(re, `$1"${proposedVersion}"`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in npm manifest`);
      }
      return patched;
    }

    case 'cargo': {
      const escapedName = packageName.replace(/[-]/g, '\\-');
      const re = new RegExp(`(${escapedName}\\s*=\\s*(?:\\{[^}]*version\\s*=\\s*|"))[^"]*("?)`, 'g');
      const patched = content.replace(re, `$1${proposedVersion}$2`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in Cargo.toml`);
      }
      return patched;
    }

    case 'pypi': {
      const escapedName = packageName.replace(/[-_.]/g, '[-_.]');
      const re = new RegExp(`(${escapedName})[>=<~!]+[\\d.*]+`, 'gi');
      const patched = content.replace(re, `$1==${proposedVersion}`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in requirements.txt`);
      }
      return patched;
    }

    case 'rubygems': {
      const escapedName = packageName.replace(/[-]/g, '\\-');
      const re = new RegExp(`(gem\\s+['"]${escapedName}['"]\\s*,\\s*['"])[^'"]*(['"])`, 'g');
      const patched = content.replace(re, `$1${proposedVersion}$2`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in Gemfile`);
      }
      return patched;
    }

    case 'conda': {
      const re = new RegExp(`(- ${packageName}=)[^\\n]*`, 'g');
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
  switch (ecosystem) {
    case 'npm': {
      const escapedName = packageName.replace(/[@/]/g, (c) => `\\${c}`);
      return content.replace(new RegExp(`\\s*"${escapedName}"\\s*:\\s*"[^"]*",?`, 'g'), '');
    }
    case 'pypi': {
      const escapedName = packageName.replace(/[-_.]/g, '[-_.]');
      return content.replace(new RegExp(`^${escapedName}[^\\n]*\\n?`, 'gim'), '');
    }
    case 'cargo': {
      return content.replace(new RegExp(`^${packageName}\\s*=.*\\n?`, 'gm'), '');
    }
    case 'rubygems': {
      return content.replace(new RegExp(`^\\s*gem\\s+['"]${packageName}['"][^\\n]*\\n?`, 'gm'), '');
    }
    case 'conda': {
      return content.replace(new RegExp(`^\\s*-\\s*${packageName}[^\\n]*\\n?`, 'gm'), '');
    }
  }
}

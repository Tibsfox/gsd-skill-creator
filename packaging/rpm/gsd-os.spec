Name:           gsd-os
Version:        1.49.5
Release:        1%{?dist}
Summary:        GSD-OS - AI-powered project management desktop

License:        MIT
URL:            https://github.com/Tibsfox/gsd-skill-creator
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  cargo >= 1.70
BuildRequires:  rust >= 1.70
BuildRequires:  nodejs >= 18
BuildRequires:  npm
BuildRequires:  webkit2gtk4.1-devel
BuildRequires:  gtk3-devel
BuildRequires:  libappindicator-gtk3-devel
BuildRequires:  librsvg2-devel
BuildRequires:  openssl-devel
BuildRequires:  scdoc

Requires:       webkit2gtk4.1
Requires:       gtk3
Recommends:     tmux

%description
GSD-OS is a desktop application for the Get Shit Done project
management framework. It integrates a tmux terminal, Claude AI
assistant, file watcher, and planning dashboard into a unified
desktop environment built with Tauri.

Features include adaptive skill creation, agent orchestration,
educational pack management, and a complete project lifecycle
from vision to delivery.

%prep
%autosetup

%build
npm ci
npm run build
cd src-tauri && cargo build --release
scdoc < extra/man/gsd-os.1.scd > extra/man/gsd-os.1
scdoc < extra/man/skill-creator.1.scd > extra/man/skill-creator.1
scdoc < extra/man/sc-config.5.scd > extra/man/sc-config.5

%install
# Binary
install -Dm755 src-tauri/target/release/gsd-os %{buildroot}%{_bindir}/gsd-os

# Man pages
install -Dm644 extra/man/gsd-os.1 %{buildroot}%{_mandir}/man1/gsd-os.1
install -Dm644 extra/man/skill-creator.1 %{buildroot}%{_mandir}/man1/skill-creator.1
install -Dm644 extra/man/sc-config.5 %{buildroot}%{_mandir}/man5/sc-config.5

# Shell completions
install -Dm644 extra/completions/skill-creator.bash %{buildroot}%{_datadir}/bash-completion/completions/skill-creator
install -Dm644 extra/completions/_skill-creator %{buildroot}%{_datadir}/zsh/vendor-completions/_skill-creator
install -Dm644 extra/completions/skill-creator.fish %{buildroot}%{_datadir}/fish/vendor_completions.d/skill-creator.fish

# Desktop entry
install -Dm644 extra/linux/com.gsd.os.desktop %{buildroot}%{_datadir}/applications/com.gsd.os.desktop

# AppStream metadata
install -Dm644 extra/linux/com.gsd.os.appdata.xml %{buildroot}%{_datadir}/metainfo/com.gsd.os.appdata.xml

# Icons
install -Dm644 src-tauri/icons/128x128.png %{buildroot}%{_datadir}/icons/hicolor/128x128/apps/com.gsd.os.png
install -Dm644 src-tauri/icons/32x32.png %{buildroot}%{_datadir}/icons/hicolor/32x32/apps/com.gsd.os.png

# systemd user service
install -Dm644 extra/systemd/gsd-os-agent.service %{buildroot}%{_userunitdir}/gsd-os-agent.service

%files
%license LICENSE
%doc README.md CHANGELOG.md
%{_bindir}/gsd-os
%{_mandir}/man1/gsd-os.1*
%{_mandir}/man1/skill-creator.1*
%{_mandir}/man5/sc-config.5*
%{_datadir}/bash-completion/completions/skill-creator
%{_datadir}/zsh/vendor-completions/_skill-creator
%{_datadir}/fish/vendor_completions.d/skill-creator.fish
%{_datadir}/applications/com.gsd.os.desktop
%{_datadir}/metainfo/com.gsd.os.appdata.xml
%{_datadir}/icons/hicolor/128x128/apps/com.gsd.os.png
%{_datadir}/icons/hicolor/32x32/apps/com.gsd.os.png
%{_userunitdir}/gsd-os-agent.service

%changelog
* Thu Feb 27 2026 GSD Project <gsd@tibsfox.com> - 1.49.5-1
- Filesystem reorganization for Linux standards compliance
- Added man pages, shell completions, desktop entry
- Added systemd user service for headless mode
- XDG Base Directory compliance

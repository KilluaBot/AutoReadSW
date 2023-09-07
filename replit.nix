{ pkgs }: {
    deps = [
        pkgs.nodejs
        pkgs.nodePackages.typescript
        pkgs.ffmpeg
        pkgs.python3
        pkgs.libwebp
        pkgs.imagemagick
        pkgs.git
        pkgs.speedtest-cli
        pkgs.zip
    ];
}
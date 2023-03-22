{ pkgs }: {
    deps = [
        pkgs.nodejs
        pkgs.git
        pkgs.yarn
    ];
    env = {
        LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
            pkgs.libuuid
        ];
    };
}


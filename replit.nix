{pkgs}: {
  deps = [
    pkgs.postgresql
    pkgs.clang
    pkgs.pkg-config
    pkgs.mesa
    pkgs.gtk3
    pkgs.flutter
  ];
}

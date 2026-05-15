mergeInto(LibraryManager.library, {
    ToggleFullscreenJS: function() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
});
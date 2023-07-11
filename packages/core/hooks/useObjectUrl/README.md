# useObjectUrl

Creates an URL for the provided `File`, `Blob`, or `MediaSource` via [URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) and automatically releases the URL via [URL.revokeObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL) when the source changes or the component is unmounted

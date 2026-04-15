export function ColorBlindFilterDefs() {
  // Simple "assist" filters (daltonization-like) to make confusing colors more distinguishable.
  // These are global SVG filters referenced from CSS via `filter: url(#...)`.
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/*
          Protanopia assist: push red-vs-green differences into blue.
          b' = b + k*(r - g)
        */}
        <filter id="cb-assist-protanopia" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values={
              [
                '1 0 0 0 0',
                '0 1 0 0 0',
                '0.70 -0.70 1 0 0',
                '0 0 0 1 0',
              ].join(' ')
            }
          />
        </filter>

        {/*
          Deuteranopia assist: push green-vs-red differences into blue.
          b' = b + k*(g - r)
        */}
        <filter id="cb-assist-deuteranopia" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values={
              [
                '1 0 0 0 0',
                '0 1 0 0 0',
                '-0.70 0.70 1 0 0',
                '0 0 0 1 0',
              ].join(' ')
            }
          />
        </filter>

        {/*
          Tritanopia assist: push blue-vs-green differences into red.
          r' = r + k*(b - g)
        */}
        <filter id="cb-assist-tritanopia" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values={
              [
                '1 -0.70 0.70 0 0',
                '0 1 0 0 0',
                '0 0 1 0 0',
                '0 0 0 1 0',
              ].join(' ')
            }
          />
        </filter>
      </defs>
    </svg>
  );
}

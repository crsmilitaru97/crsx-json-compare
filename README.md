# @crsx/json-compare

Angular component for visualizing JSON diffs.

## Installation

```bash
npm install @crsx/json-compare
```

## Usage

Import `JsonCompareComponent` and use it in your template:

```typescript
import { JsonCompareComponent } from '@crsx/json-compare';

@Component({
  standalone: true,
  imports: [JsonCompareComponent],
  template: `
    <json-compare
      [jsonLeft]="leftJson"
      [jsonRight]="rightJson"
      defaultView="split">
    </json-compare>
  `
})
export class AppComponent {
  leftJson = { foo: 'bar' };
  rightJson = { foo: 'baz' };
}
```

## API

### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `jsonLeft` | `any` | `null` | Left-side JSON object/array/string. |
| `jsonRight` | `any` | `null` | Right-side JSON object/array/string. |
| `leftLabel` | `string` | `'Original'` | Label for the left side. |
| `rightLabel` | `string` | `'Modified'` | Label for the right side. |
| `defaultView` | `'merged' \| 'split'` | `'merged'` | Initial view mode. |
| `showViewSwitch` | `boolean` | `true` | Show merged/split toggle. |
| `viewMergedLabel` | `string` | `'Merged'` | Label for the merged view option. |
| `viewSplitLabel` | `string` | `'Split'` | Label for the split view option. |
| `chooseFileLabel` | `string` | `'Choose File'` | Label for the Choose File button. |
| `showBrowseButtons` | `boolean` | `true` | Show file upload buttons. |
| `showHeaderToolbar` | `boolean` | `true` | Show the header toolbar. |
| `showFooterToolbar` | `boolean` | `true` | Show the footer toolbar. |

### Outputs

- `diffChange`: Emits `DiffNode[]` when diff is computed.
- `viewModeChange`: Emits `'merged' | 'split'` when view mode changes.
- `fileLoaded`: Emits `{ side: number; file: File }` when a file is loaded.
- `fileLoadError`: Emits `{ side: number; error: any }` on load error.
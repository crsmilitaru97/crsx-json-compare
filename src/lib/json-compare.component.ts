import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

export type DiffType = 'add' | 'remove' | 'modify' | 'same';

export interface DiffNode {
    key: string;
    type: DiffType;
    value?: any;
    oldValue?: any;
    children?: DiffNode[];
    expanded?: boolean;
}

//** Component for comparing two JSON objects and visualizing their differences. */
@Component({
    selector: 'json-compare',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './json-compare.component.html',
    styleUrls: ['./json-compare.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonCompareComponent implements OnChanges {
    //** The left JSON object to compare. */
    @Input() jsonLeft: any = null;
    //** The right JSON object to compare against. */
    @Input() jsonRight: any = null;
    //** Label for the left JSON. */
    @Input() leftLabel: string = 'Original';
    //** Label for the right JSON. */
    @Input() rightLabel: string = 'Modified';
    //** Whether to show the view switch. */
    @Input() showViewSwitch: boolean = true;
    //** Label for the merged view option. */
    @Input() viewMergedLabel: string = 'Merged';
    //** Label for the split view option. */
    @Input() viewSplitLabel: string = 'Split';
    //** Whether to show the file browse buttons. When enabled, the left and right labels will be the file names. */
    @Input() showBrowseButtons: boolean = true;
    //** Label for the Choose File button. */
    @Input() chooseFileLabel: string = 'Choose File';
    //** Whether to show the header toolbar.  */
    @Input() showHeaderToolbar: boolean = true;
    //** Whether to show the footer toolbar. */
    @Input() showFooterToolbar: boolean = true;
    //** Default view mode ('merged' or 'split'). */
    @Input() defaultView: 'merged' | 'split' = 'merged';


    //** Emitted when a diff is computed. */
    @Output() diffChange = new EventEmitter<DiffNode[]>();
    //** Emitted when the view mode changes. */
    @Output() viewModeChange = new EventEmitter<'merged' | 'split'>();
    //** Emitted when a file is loaded (parsed). */
    @Output() fileLoaded = new EventEmitter<{ side: number; file: File }>();
    //** Emitted when a file fails to load/parse. */
    @Output() fileLoadError = new EventEmitter<{ side: number; error: any }>();

    diffTree: DiffNode[] = [];
    viewMode: 'merged' | 'split' = 'merged';

    get bothPresent(): boolean {
        const left = this.parseIfJson(this.jsonLeft);
        const right = this.parseIfJson(this.jsonRight);
        return left !== null && typeof left !== 'undefined' && right !== null && typeof right !== 'undefined';
    }

    constructor(
        private cdr: ChangeDetectorRef
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['defaultView'] && typeof changes['defaultView'].currentValue !== 'undefined') {
            this.viewMode = this.defaultView;
            this.viewModeChange.emit(this.viewMode);
        }

        if (changes['jsonLeft'] || changes['jsonRight']) {
            this.generateDiff();
        }
    }

    onFileSelected(event: Event, side: 1 | 2): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length) {
            const file = input.files[0];
            if (this.showBrowseButtons) {
                if (side === 1) this.leftLabel = this.getBaseFileName(file.name);
                else this.rightLabel = this.getBaseFileName(file.name);
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = JSON.parse(e.target?.result as string);
                    if (side === 1) this.jsonLeft = content;
                    else this.jsonRight = content;

                    this.fileLoaded.emit({ side, file });
                    this.generateDiff();
                    this.cdr.markForCheck();
                } catch (err) {
                    this.fileLoadError.emit({ side, error: err });
                }
            };
            reader.readAsText(file);
        }
    }

    setView(mode: 'merged' | 'split'): void {
        if (this.viewMode === mode) return;
        this.viewMode = mode;
        this.viewModeChange.emit(this.viewMode);
    }

    toggleNode(node: DiffNode): void {
        node.expanded = !node.expanded;
    }

    private generateDiff(): void {
        const left = this.parseIfJson(this.jsonLeft);
        const right = this.parseIfJson(this.jsonRight);

        const leftPresent = left !== null && typeof left !== 'undefined';
        const rightPresent = right !== null && typeof right !== 'undefined';

        if (leftPresent && rightPresent) {
            if (this.isObject(left) && this.isObject(right)) {
                this.diffTree = this.compare(left, right);
            } else {
                this.diffTree = this.primitiveDiff(left, right);
            }
            this.diffChange.emit(this.diffTree);
        } else if (leftPresent && !rightPresent) {
            if (this.isObject(left)) {
                this.diffTree = this.objToDiff(left, 'same');
            } else {
                this.diffTree = [{ key: '(root)', type: 'same', value: left }];
            }
        } else if (!leftPresent && rightPresent) {
            if (this.isObject(right)) {
                this.diffTree = this.objToDiff(right, 'same');
            } else {
                this.diffTree = [{ key: '(root)', type: 'same', value: right }];
            }
        } else {
            this.diffTree = [];
        }

        this.cdr.markForCheck();
    }

    private parseIfJson(value: any): any {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch (_err) {
                return value;
            }
        }
        return value;
    }

    private primitiveDiff(left: any, right: any): DiffNode[] {
        const key = '(root)';
        if ((left === undefined || left === null) && (right !== undefined && right !== null)) {
            return [{ key, type: 'add', value: right }];
        }
        if ((right === undefined || right === null) && (left !== undefined && left !== null)) {
            return [{ key, type: 'remove', value: left }];
        }
        if (left === right) {
            return [{ key, type: 'same', value: left }];
        }
        return [{ key, type: 'modify', value: right, oldValue: left }];
    }

    private compare(obj1: any, obj2: any, key: string = ''): DiffNode[] {
        const diffs: DiffNode[] = [];
        const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

        const sortedKeys = Array.from(keys).sort((a, b) => {
            const na = Number(a);
            const nb = Number(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
        });

        for (const k of sortedKeys) {
            const val1 = obj1 ? obj1[k] : undefined;
            const val2 = obj2 ? obj2[k] : undefined;

            const isObj1 = this.isObject(val1);
            const isObj2 = this.isObject(val2);

            if (val1 === undefined) {
                diffs.push({ key: k, type: 'add', value: val2, expanded: true, children: isObj2 ? this.objToDiff(val2, 'add') : undefined });
            } else if (val2 === undefined) {
                diffs.push({ key: k, type: 'remove', value: val1, expanded: true, children: isObj1 ? this.objToDiff(val1, 'remove') : undefined });
            } else if (isObj1 && isObj2) {
                const children = this.compare(val1, val2);
                const hasChanges = children.some(c => c.type !== 'same');
                diffs.push({
                    key: k,
                    type: hasChanges ? 'modify' : 'same',
                    children,
                    expanded: hasChanges
                });
            } else if (val1 !== val2) {
                diffs.push({ key: k, type: 'modify', value: val2, oldValue: val1 });
            } else {
                diffs.push({ key: k, type: 'same', value: val1 });
            }
        }

        return diffs;
    }

    private isObject(val: any): boolean {
        return val !== null && typeof val === 'object';
    }

    private objToDiff(obj: any, type: DiffType): DiffNode[] {
        if (!this.isObject(obj)) return [];
        return Object.keys(obj).map(k => {
            const val = obj[k];
            const isObj = this.isObject(val);
            return {
                key: k,
                type: type,
                value: val,
                expanded: true,
                children: isObj ? this.objToDiff(val, type) : undefined
            };
        });
    }

    private getBaseFileName(name?: string): string {
        const n = name ?? '';
        const idx = n.lastIndexOf('.');
        return idx > 0 ? n.slice(0, idx) : n;
    }

    getTypeClass(node: DiffNode): string {
        return `diff-${node.type}`;
    }
}
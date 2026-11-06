export type HeapType = 'max' | 'min';

export class BinaryHeap {

    private data: number[] = [];

    constructor(private heapType: HeapType = 'max') {}


    get size(): number {
        return this.data.length;
    }


    get type(): HeapType {
        return this.heapType;
    }


    toArray(): number[] {
        return [...this.data];
    }


    // Changes heap type and rebuilds the heap.

    setType(type: HeapType): void {
        this.heapType = type;
        this.build(this.data);
    }


    // Builds a heap from an array.

    build(values: number[]): void {

        if (values.length > 127) {
            throw new Error('Maximum heap size is 127 elements.');
        }

        this.data = [...values];

        for (
            let i = Math.floor(this.data.length / 2) - 1;
            i >= 0;
            i--
        ) {
            this.siftDown(i);
        }
    }


    // Inserts a new element.

    insert(value: number): void {

        if (this.data.length >= 127) {
            throw new Error('Maximum heap size is 127 elements.');
        }

        this.data.push(value);

        this.siftUp(this.data.length - 1);
    }


    // Removes and returns the root element.

    extractRoot(): number {

        if (this.data.length === 0) {
            throw new Error('Heap is empty.');
        }

        const root = this.data[0];

        const last = this.data.pop();

        if (this.data.length > 0 && last !== undefined) {

            this.data[0] = last;

            this.siftDown(0);
        }

        return root;
    }


    // Removes all elements.

    clear(): void {
        this.data = [];
    }


    // Checks which element has higher priority.

    private comesBefore(a: number, b: number): boolean {

        if (this.heapType === 'max') {
            return a > b;
        }

        return a < b;
    }


    // Exchanges two elements.

    private swap(i: number, j: number): void {

        const temp = this.data[i];

        this.data[i] = this.data[j];

        this.data[j] = temp;
    }


    // Moves an element upward.

    private siftUp(index: number): void {

        while (index > 0) {

            const parent = Math.floor((index - 1) / 2);

            if (!this.comesBefore(
                this.data[index],
                this.data[parent]
            )) {
                break;
            }

            this.swap(index, parent);

            index = parent;
        }
    }


    // Moves an element downward.

    private siftDown(index: number): void {

        const size = this.data.length;

        while (true) {

            const left = 2 * index + 1;

            const right = 2 * index + 2;

            let best = index;


            if (
                left < size &&
                this.comesBefore(this.data[left], this.data[best])
            ) {
                best = left;
            }


            if (
                right < size &&
                this.comesBefore(this.data[right], this.data[best])
            ) {
                best = right;
            }


            if (best === index) {
                break;
            }


            this.swap(index, best);

            index = best;
        }
    }
}
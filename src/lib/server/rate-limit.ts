/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

interface IRefillBucket {
	count: number;
	refilledAt: number;
}

interface IExpiringBucket {
	count: number;
	createdAt: number;
}

interface IThrottlingCounter {
	timeout: number;
	updatedAt: number;
}

export class RefillingTokenBucket<T> {
	public max: number;
	public refillIntervalSeconds: number;

	constructor(max: number, refillIntervalSeconds: number) {
		this.max = max;
		this.refillIntervalSeconds = refillIntervalSeconds;
	}

	private storage = new Map<T, IRefillBucket>();

	public check(key: T, cost: number): boolean {
		const bucket = this.storage.get(key) ?? null;
    // Bucket not yet initialized; OK
		if (bucket === null) {
			return true;
		}
    // Does cost fit in refilled amount
		const now = Date.now();
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		if (refill > 0) {
			return Math.min(bucket.count + refill, this.max) >= cost;
		}
    // Does cost fit in bucket count
		return bucket.count >= cost;
	}

	public consume(key: T, cost: number): boolean {
		let bucket = this.storage.get(key) ?? null;
		const now = Date.now();
    // Bucket not yet initialized; Initialize and subtract cost from max
		if (bucket === null) {
			bucket = {
				count: this.max - cost,
				refilledAt: now
			};
			this.storage.set(key, bucket);
			return true;
		}
    // Add refill to bucket count
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		bucket.count = Math.min(bucket.count + refill, this.max);
		bucket.refilledAt = now;
		if (bucket.count < cost) {
			return false;
		}
    // Update key in bucket
		bucket.count -= cost;
		this.storage.set(key, bucket);
		return true;
	}
}

export class Throttler<T> {
	public timeoutSeconds: number[];

	private storage = new Map<T, IThrottlingCounter>();

	constructor(timeoutSeconds: number[]) {
		this.timeoutSeconds = timeoutSeconds;
	}

	public consume(key: T): boolean {
		let counter = this.storage.get(key) ?? null;
		const now = Date.now();
    // Counter not yet initialized; Initialize
		if (counter === null) {
			counter = {
				timeout: 0,
				updatedAt: now
			};
			this.storage.set(key, counter);
			return true;
		}
    // Are we passed timeout; Subtract updatedAt from now, if more than timeout has passed it's allowed.
		const allowed = now - counter.updatedAt >= this.timeoutSeconds[counter.timeout] * 1000;
		if (!allowed) {
			return false;
		}
    // Update key in counter
		counter.updatedAt = now;
		counter.timeout = Math.min(counter.timeout + 1, this.timeoutSeconds.length - 1);
		this.storage.set(key, counter);
		return true;
	}

	public reset(key: T): void {
		this.storage.delete(key);
	}
}

export class ExpiringTokenBucket<T> {
	public max: number;
	public expiresInSeconds: number;

	private storage = new Map<T, IExpiringBucket>();

	constructor(max: number, expiresInSeconds: number) {
		this.max = max;
		this.expiresInSeconds = expiresInSeconds;
	}

	public check(key: T, cost: number): boolean {
		const bucket = this.storage.get(key) ?? null;
		const now = Date.now();
    // Bucket not yet initialized
		if (bucket === null) {
			return true;
		}
    // Has expired
		if (now - bucket.createdAt >= this.expiresInSeconds * 1000) {
			return true;
		}
    // Does cost fit in bucket count
		return bucket.count >= cost;
	}

	public consume(key: T, cost: number): boolean {
		let bucket = this.storage.get(key) ?? null;
		const now = Date.now();
    // Bucket not yet initialized; Initialize and subtract cost from max
		if (bucket === null) {
			bucket = {
				count: this.max - cost,
				createdAt: now
			};
			this.storage.set(key, bucket);
			return true;
		}
    // Has expired; Reset count to max
		if (now - bucket.createdAt >= this.expiresInSeconds * 1000) {
			bucket.count = this.max;
		}
    // Cost does not fit in count
		if (bucket.count < cost) {
			return false;
		}
    // Update key in bucket
		bucket.count -= cost;
		this.storage.set(key, bucket);
		return true;
	}

	public reset(key: T): void {
		this.storage.delete(key);
	}
}

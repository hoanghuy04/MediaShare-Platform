type FollowListener = (userId: string, isFollowing: boolean) => void;

class FollowEventManager {
    private listeners: FollowListener[] = [];
    private cache: Record<string, boolean> = {};

    subscribe(listener: FollowListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    emit(userId: string, isFollowing: boolean) {
        this.cache[userId] = isFollowing;
        this.listeners.forEach(l => l(userId, isFollowing));
    }

    getStatus(userId: string): boolean | undefined {
        return this.cache[userId];
    }
}

export const followEventManager = new FollowEventManager();

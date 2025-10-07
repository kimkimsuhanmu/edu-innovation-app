/**
 * 전역 이벤트 버스 유틸리티
 * 컴포넌트 간 실시간 상태 동기화를 위한 이벤트 시스템
 */

type EventCallback = (data?: any) => void;

class EventBus {
  private events: { [key: string]: EventCallback[] } = {};

  /**
   * 이벤트 리스너 등록
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    console.log(`EventBus: 이벤트 리스너 등록 - ${event}`, {
      event,
      totalListeners: this.events[event].length
    });
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * 이벤트 발생
   */
  emit(event: string, data?: any): void {
    console.log(`EventBus: 이벤트 발생 - ${event}`, {
      event,
      data,
      listenerCount: this.events[event]?.length || 0
    });
    
    if (!this.events[event]) {
      console.log(`EventBus: 이벤트 ${event}에 대한 리스너가 없음`);
      return;
    }
    
    this.events[event].forEach((callback, index) => {
      try {
        console.log(`EventBus: 리스너 ${index + 1}/${this.events[event].length} 호출`);
        callback(data);
      } catch (error) {
        console.error(`이벤트 핸들러 에러 (${event}):`, error);
      }
    });
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// 전역 이벤트 버스 인스턴스
export const eventBus = new EventBus();

// 이벤트 타입 정의
export const EVENTS = {
  FAVORITE_CHANGED: 'favorite-changed',
  LIKE_CHANGED: 'like-changed',
  VIEW_COUNT_CHANGED: 'view-count-changed',
  CONTENT_UPDATED: 'content-updated',
} as const;

export default eventBus;

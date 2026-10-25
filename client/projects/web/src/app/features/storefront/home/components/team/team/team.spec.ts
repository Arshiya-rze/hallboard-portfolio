import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Team } from './team';

describe('Team mobile stack', () => {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    TestBed.configureTestingModule({ imports: [Team] });
    TestBed.overrideComponent(Team, {
      set: {
        template: `<section data-team-section>
          <h2 id="team-title">تیم هالبورد</h2>
          <div data-team-track><div data-team-stage><div class="team-grid">
            <div data-team-scene><article data-team-card><div class="team-card-visual"></div><div class="team-card-content"></div></article></div>
            <div data-team-scene><article data-team-card><div class="team-card-visual"></div><div class="team-card-content"></div></article></div>
          </div></div></div>
        </section>`,
      },
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight });
  });

  function initialize(height: number) {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
    const fixture = TestBed.createComponent(Team);
    const root = fixture.nativeElement.querySelector('[data-team-section]') as HTMLElement;
    const stage = root.querySelector<HTMLElement>('[data-team-stage]')!;
    vi.spyOn(root.querySelector<HTMLElement>('[data-team-track]')!, 'getBoundingClientRect')
      .mockImplementation(() => ({
        top: Number.parseFloat(stage.style.getPropertyValue('--team-stack-top')) || 0,
      } as DOMRect));
    Object.defineProperty(root.querySelector('#team-title'), 'offsetHeight', { value: 50 });
    root.querySelectorAll<HTMLElement>('[data-team-card]').forEach((card) => {
      // A larger-font card is 650px tall, including its 180px portrait.
      Object.defineProperty(card, 'offsetHeight', {
        get: () => 470 + Number.parseFloat(root.style.getPropertyValue('--team-visual-height') || '180'),
      });
      Object.defineProperty(card.querySelector('.team-card-visual'), 'offsetHeight', { value: 180 });
    });
    // Exercise the actual controller without waiting for app stability/fonts.
    (fixture.componentInstance as unknown as { initializeCardMotion(): void }).initializeCardMotion();
    return root;
  }

  it('keeps stacking larger-text cards by reclaiming mobile title and portrait space', () => {
    const root = initialize(760);
    expect(root.classList.contains('is-stack-ready')).toBe(true);
    expect(root.classList.contains('is-stack-fitting')).toBe(false);
    expect(Number.parseFloat(root.style.getPropertyValue('--team-visual-height'))).toBeLessThan(120);
    const stage = root.querySelector<HTMLElement>('[data-team-stage]')!;
    expect(Number.parseFloat(stage.style.getPropertyValue('--team-stage-height'))).toBeLessThanOrEqual(568);
    expect(root.querySelectorAll('[aria-hidden="true"]').length).toBe(1);
  });

  it('retains natural flow when even the minimum portrait and readable copy cannot fit', () => {
    const root = initialize(560);
    expect(root.classList.contains('is-stack-ready')).toBe(false);
    expect(root.classList.contains('is-stack-fitting')).toBe(false);
    expect(root.style.getPropertyValue('--team-visual-height')).toBe('');
    expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('keeps exposed cards interactive throughout the incoming mobile card transition', () => {
    let frame: FrameRequestCallback | undefined;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback;
      return 1;
    });
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0);
    const root = initialize(760);
    const stage = root.querySelector<HTMLElement>('[data-team-stage]')!;
    const track = root.querySelector<HTMLElement>('[data-team-track]')!;
    const scenes = root.querySelectorAll<HTMLElement>('[data-team-scene]');
    const stageHeight = Number.parseFloat(stage.style.getPropertyValue('--team-stage-height'));
    const step = Number.parseFloat(track.style.getPropertyValue('--team-stack-total-height')) - stageHeight;

    for (const progress of [0.3, 0.5, 0.7]) {
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(step * progress);
      window.dispatchEvent(new Event('scroll'));
      frame!(0);
      for (const scene of scenes) {
        expect(scene.inert).toBe(false);
        expect(scene.getAttribute('aria-hidden')).toBe('false');
      }
    }

    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(step + 1);
    window.dispatchEvent(new Event('scroll'));
    frame!(0);
    expect(scenes[0].inert).toBe(true);
    expect(scenes[1].inert).toBe(false);
  });
});

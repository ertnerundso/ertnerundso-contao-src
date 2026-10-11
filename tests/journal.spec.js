import { test, expect } from '@playwright/test';
async function start(page, width, english = false) {
  await page.setViewportSize({ width, height: 1000 });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.fulfill({status:200,contentType:'application/javascript',body:''}));
  await page.goto('/tests/fixtures/frames.html');
  await page.evaluate(english => {
    document.documentElement.lang = english ? 'en' : 'de';
    const list = document.querySelector('.journal-list');
    while (list.children.length < 8) list.append(list.children[0].cloneNode(true));
    [...list.children].forEach((card,index) => { card.querySelector('h3 a').href = `#article-${index}`; });
  }, english);
  await page.addScriptTag({ type:'module', url:'/dist/site.js' });
  await expect(page.locator('.journal-list')).toHaveClass(/is-journal-paged/);
}
async function expectWholePage(page) {
  const geometry = await page.locator('.journal-list').evaluate(list => {
    const frame = list.getBoundingClientRect();
    const cards = [...list.children].filter(card => !card.hidden);
    return {left:frame.left,right:frame.right,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      cards:cards.map(card => { const rect=card.getBoundingClientRect(); return {left:rect.left,right:rect.right,width:rect.width,height:rect.height}; })};
  });
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.cards[0].left).toBeCloseTo(geometry.left,0);
  expect(geometry.cards.at(-1).right).toBeCloseTo(geometry.right,0);
  for (const [index,card] of geometry.cards.entries()) {
    expect(card.width).toBeCloseTo(geometry.cards[0].width,0);
    expect(card.height).toBeCloseTo(geometry.cards[0].height,0);
    if(index) expect(card.left).toBeCloseTo(geometry.cards[index-1].right,0);
  }
  for (const card of await page.locator('.journal-row:visible').all()) {
    const link=card.locator('.journal-read-link');
    await expect(link).toHaveAttribute('href',await card.locator('h3 a').getAttribute('href'));
    await expect(link).toHaveCSS('font-weight','400');
    await expect(link.locator('.button-arrow')).toHaveCount(1);
    await expect(link).toHaveClass(/btn--secondary/);
    await expect(link).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  }
}
for(const width of [360,390,760,1000,1440,2560]) {
  test(`journal pages show whole aligned cards at ${width}px, including final page`,async({page})=>{
    await start(page,width);
    const next=page.getByRole('button',{name:'Nächste Beiträge'}),back=page.getByRole('button',{name:'Vorherige Beiträge'});
    await expect(back).toBeDisabled();
    const controls = await page.locator('.journal-slider-controls').evaluate(el => {
      const list = document.querySelector('.journal-list').getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const link = document.querySelector('.journal-heading-actions > .text-link').getBoundingClientRect();
      return {left:rect.left-list.left,right:rect.right-list.right,bottom:rect.bottom-list.top,
        overlapsLink:rect.left<link.right && rect.right>link.left && rect.top<link.bottom && rect.bottom>link.top};
    });
    expect(controls.left).toBeGreaterThanOrEqual(-0.5);
    expect(controls.right).toBeLessThanOrEqual(0.5);
    expect(controls.bottom).toBeLessThan(0);
    expect(controls.overlapsLink).toBe(false);
    await expect(page.locator('.section-head .journal-heading-actions .journal-slider-controls')).toHaveCount(1);
    await expect(page.locator('.journal-heading-actions > .text-link')).toBeVisible();
    for (const button of [back,next]) {
      await expect(button.locator('.button-label')).toBeHidden();
      const rect = await button.boundingBox();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.width).toBeCloseTo(rect.height,0);
    }
    const visited=new Set();
    for(let iteration=0;iteration<8;iteration++) {
      await expectWholePage(page);
      for(const url of await page.locator('.journal-row:visible h3 a').evaluateAll(links=>links.map(a=>a.getAttribute('href')))) visited.add(url);
      if(await next.isDisabled()) break;
      await next.click();
    }
    expect(visited.size).toBe(8);
    await expect(next).toBeDisabled();
    await page.locator('.journal-list').press('Home');
    await expect(back).toBeDisabled();
    await page.locator('.journal-list').press('End');
    await expect(next).toBeDisabled();
    await page.setViewportSize({width:390,height:1000});
    await expect(page.locator('.journal-row:visible')).toHaveCount(1);
    await expectWholePage(page);
  });
}
test('journal preserves numbering, English labels and focus during reflow',async({page})=>{
  await start(page,1440,true);
  await expect(page.getByRole('button',{name:'Next articles'})).toBeVisible();
  await page.locator('.journal-list').press('End');
  await expect(page.locator('.journal-row:visible .row-category').first()).toHaveAttribute('data-journal-index','06');
  await page.locator('.journal-row:visible .journal-read-link').last().focus();
  await page.setViewportSize({width:390,height:1000});
  await expect(page.locator('.journal-row:visible')).toHaveCount(1);
  await expect(page.locator('.journal-list')).toBeFocused();
  await expect(page.locator('.journal-slider-status')).toHaveText('06–06 / 08');
});
test('journal handles swipes without translating partial cards',async({page})=>{
  await start(page,390);
  await page.locator('.journal-list').evaluate(list=>{
    const init={identifier:0,target:list,clientX:250,clientY:100};
    list.dispatchEvent(new TouchEvent('touchstart',{touches:[new Touch(init)]}));
    list.dispatchEvent(new TouchEvent('touchend',{changedTouches:[new Touch({...init,clientX:100})]}));
  });
  await expect(page.locator('.journal-slider-status')).toHaveText('02–02 / 08');
  await expectWholePage(page);
});

for (const motion of ['reduce','no-preference']) {
  test(`arrow-only controls stay centered on hover/focus and support keyboard with ${motion} motion`, async({page})=>{
    await page.emulateMedia({reducedMotion:motion});
    await start(page,390);
    const next=page.getByRole('button',{name:'Nächste Beiträge'});
    const back=page.getByRole('button',{name:'Vorherige Beiträge'});
    await expect(next).toHaveClass(/is-button-ready/);
    const original=await next.boundingBox();
    await next.hover();
    await next.focus();
    await expect.poll(async()=>next.evaluate(button=>{
      const b=button.getBoundingClientRect(),a=button.querySelector('.button-arrow').getBoundingClientRect();
      return Math.abs((a.left+a.right)-(b.left+b.right));
    })).toBeLessThan(0.5);
    const focused=await next.boundingBox();
    expect(focused.width).toBe(original.width);
    await next.press('Enter');
    await expect(page.locator('.journal-slider-status')).toHaveText('02–02 / 08');
    await back.press('Space');
    await expect(page.locator('.journal-slider-status')).toHaveText('01–01 / 08');
  });
}

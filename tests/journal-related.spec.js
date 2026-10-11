import { test, expect } from '@playwright/test';

async function expectWholeCards(track) {
  const geometry = await track.evaluate(list => {
    const frame = list.getBoundingClientRect();
    return {left:frame.left,right:frame.right,
      cards:[...list.children].filter(card => !card.hidden).map(card => {
        const rect=card.getBoundingClientRect();
        return {left:rect.left,right:rect.right,height:rect.height};
      })};
  });
  expect(geometry.cards[0].left).toBeCloseTo(geometry.left,0);
  expect(geometry.cards.at(-1).right).toBeCloseTo(geometry.right,0);
  for (const [index,card] of geometry.cards.entries()) {
    expect(card.height).toBeCloseTo(geometry.cards[0].height,0);
    if(index) expect(card.left).toBeCloseTo(geometry.cards[index-1].right,0);
  }
}

for (const width of [390, 760, 1440, 1920]) {
  test(`related articles use whole-card Journal paging at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/fixtures/journal-article.html');
    await page.addScriptTag({ type: 'module', url: '/dist/site.js' });

    const track = page.locator('.journal-related .mod_newslist');
    const previous=page.getByRole('button',{name:'Vorherige Beiträge'});
    const next=page.getByRole('button',{name:'Nächste Beiträge'});
    await expect(track).toHaveClass(/is-journal-paged/);
    await expect(track.locator('.journal-related-card')).toHaveCount(5);
    await expect(track).toHaveAttribute('role','region');
    await expect(page.locator('.news-detail-outro .section-head .journal-slider-controls')).toHaveCount(1);
    await expect(page.getByRole('link',{name:'Alle Artikel'})).toHaveAttribute('href','/journal/');
    await expect(previous).toBeDisabled();
    const controls=await page.locator('.journal-slider-controls').boundingBox();
    const frame=await track.boundingBox();
    expect(controls.y+controls.height).toBeLessThan(frame.y);
    const visited=new Set();
    for(let step=0;step<5;step++) {
      await expectWholeCards(track);
      for(const card of await track.locator('.journal-row:visible').all()) {
        const href=await card.locator('h3 a').getAttribute('href');
        visited.add(href);
        await expect(card.locator('.journal-read-link')).toHaveAttribute('href',href);
        await expect(card.locator('.journal-read-link')).toHaveClass(/btn--secondary/);
        await expect(card.locator('time')).toHaveAttribute('datetime','2026-09-29');
      }
      if(await next.isDisabled()) break;
      await next.click();
    }
    expect(visited.size).toBe(5);
    await expect(next).toBeDisabled();
    await expect(track.locator('.journal-related-card').last()).toBeVisible();
    await track.press('Home');
    await expect(previous).toBeDisabled();
    await track.press('End');
    await expect(next).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test('related articles remain reachable without JavaScript', async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 });
  await page.goto('/tests/fixtures/journal-article.html');
  const track=page.locator('.journal-related .mod_newslist');
  await expect(track.locator('.journal-related-card')).toHaveCount(5);
  await expect(page.locator('.journal-slider-controls')).toHaveCount(0);
  expect(await track.evaluate(element=>element.scrollWidth>element.clientWidth)).toBe(true);
  await track.evaluate(element=>{ element.scrollLeft=element.scrollWidth; });
  expect(await track.evaluate(element=>{
    const trackRect=element.getBoundingClientRect();
    const cardRect=element.querySelector('.journal-related-card:last-child').getBoundingClientRect();
    return cardRect.left<trackRect.right && cardRect.right>trackRect.left;
  })).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('single related article hides navigation and English recommendations use English labels',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/tests/fixtures/journal-article.html');
  await page.evaluate(()=>{
    document.documentElement.lang='en';
    document.querySelectorAll('.journal-related-card:not(:first-child)').forEach(card=>card.remove());
  });
  await page.addScriptTag({type:'module',url:'/dist/site.js'});
  await expect(page.locator('.journal-related .mod_newslist')).toHaveClass(/is-journal-paged/);
  await expect(page.locator('.journal-slider-controls')).toBeHidden();
  await expect(page.getByRole('link',{name:/Read article:/})).toBeVisible();
});

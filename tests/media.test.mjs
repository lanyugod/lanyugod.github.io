import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaUrl, normalizeOrigin, rehypeMedia } from '../src/plugins/public-media.mjs';
test('empty origin keeps local article media available without a NAS', () => {
  assert.equal(mediaUrl('/images/posts/spring-boot/legacy.png'), '/images/posts/spring-boot/legacy.png');
});
test('NAS switch preserves Unicode, spaces and exact image path', () => {
  const result = new URL(mediaUrl('/images/posts/Spring Boot/图片.png', 'https://files.example.com'));
  assert.equal(decodeURI(result.pathname), '/images/posts/Spring Boot/图片.png');
  assert.equal(result.hostname, 'files.example.com');
  assert.match(mediaUrl('/images/gallery/新年快乐.jpeg', 'https://files.example.com'), /^https:\/\/files.example.com\//);
});
test('brand assets, remote covers and external links are not rewritten', () => {
  for (const file of ['/images/cat.jpeg','/images/猫猫-copy.png','https://example.org/a.png','//example.org/a.png']) assert.equal(mediaUrl(file,'https://files.example.com'),file);
});
test('media configuration rejects credential-bearing and ambiguous URLs', () => {
  for (const value of ['http://files.example.com','https://name:password@files.example.com','https://files.example.com/base','https://files.example.com?secret=x','https://files.example.com#x','not-a-url']) assert.throws(()=>normalizeOrigin(value));
});
test('Markdown transform changes images only and adds lazy loading', () => {
  const tree = { type:'root', children:[{type:'element',tagName:'img',properties:{src:'/images/gallery/新年快乐.jpeg'}},{type:'element',tagName:'a',properties:{href:'/images/gallery/新年快乐.jpeg'}}] };
  rehypeMedia({origin:'https://files.example.com'})(tree);
  assert.match(tree.children[0].properties.src,/^https:\/\/files.example.com/);
  assert.equal(tree.children[0].properties.loading,'lazy');
  assert.equal(tree.children[1].properties.href,'/images/gallery/新年快乐.jpeg');
});

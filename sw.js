/* Happy Wife — push only.
   This replaces a self-removing worker that unregistered itself and deleted
   every cache on each visit. On a phone where it was already active that
   produced a white screen: it wiped what it was serving. It did its job and
   should not have been left in place.

   This one clears any cache it finds once, on activate, and then stops
   touching anything. No fetch handler, so nothing is ever served from cache. */

self.addEventListener('install', function(){ self.skipWaiting(); });

self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function(k){ return caches.delete(k); }));
    } catch (err) {}
    try { await self.clients.claim(); } catch (err) {}
  })());
});

self.addEventListener('push', function(event){
  var d = { title: 'Happy Wife', body: 'One small thing today.' };
  try { if (event.data) d = Object.assign(d, event.data.json()); } catch (err) {}
  event.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body, icon: 'icon-192.png', badge: 'icon-192.png',
      tag: 'hw-daily', renotify: false, data: { url: d.url || './' }
    })
  );
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for (var i = 0; i < list.length; i++){
        if (list[i].url.indexOf(target) !== -1 && 'focus' in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

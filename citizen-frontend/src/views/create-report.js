import { api } from '../api.js';
import { toast } from '../toast.js';
import { getUser } from '../auth.js';

export function renderCreateReport(root, { navigate }) {
  const user = getUser();
  const contactNote = user && (user.phone || user.address)
    ? `<p class="hint muted">Əlaqə üçün profilinizdəki${user.phone ? ' <strong>'+escapeHtml(user.phone)+'</strong>' : ''}${user.phone && user.address ? ' və' : ''}${user.address ? ' <strong>'+escapeHtml(user.address)+'</strong>' : ''} istifadə olunacaq.</p>`
    : `<p class="hint muted">Əlaqə vasitəsi olmadığı təqdirdə admin sizə yalnız profil e-poçtu vasitəsilə cavab verəcək. <a href="#/profile">Profili tamamlayın</a>.</p>`;
  root.innerHTML = `
    <div class="page-head">
      <h2>Yeni Müraciət</h2>
      <a href="#/reports" class="btn btn-secondary">Müraciətlərim</a>
    </div>
    <div class="card">
      <form id="report-form" class="form-stack" novalidate>
        ${contactNote}
        <div>
          <label for="title">Başlıq</label>
          <input id="title" name="title" type="text" placeholder="Məs: Sahil küçəsində su sızması" required />
        </div>
        <div>
          <label for="description">Təsvir</label>
          <textarea id="description" name="description" placeholder="Problemi qısaca izah edin..." required></textarea>
        </div>

        <div>
          <label>Şəkil (max 5 MB)</label>
          <div class="upload-zone" id="upload-zone">
            <strong>Şəkil yükləmək üçün klikləyin</strong>
            <p>JPG, PNG, WEBP və ya GIF</p>
            <input type="file" id="image-input" accept="image/*" hidden />
            <img class="preview" id="image-preview" alt="" hidden />
          </div>
        </div>

        <div>
          <label>Konum</label>
          <div class="form-row">
            <div>
              <label for="latitude" class="muted">Latitude</label>
              <input id="latitude" name="latitude" type="text" readonly placeholder="—" />
            </div>
            <div>
              <label for="longitude" class="muted">Longitude</label>
              <input id="longitude" name="longitude" type="text" readonly placeholder="—" />
            </div>
          </div>
          <div class="flex gap-1 mt-1">
            <button type="button" class="btn btn-secondary" id="locate-btn">Konumu Avtomatik Tap</button>
            <button type="button" class="btn btn-ghost" id="clear-loc-btn" hidden>Sil</button>
          </div>
          <div id="location-map" class="mt-2" hidden></div>
        </div>

        <div class="flex gap-1">
          <button type="submit" class="btn" id="submit-btn">Müraciəti Göndər</button>
          <a href="#/reports" class="btn btn-secondary">Ləğv et</a>
        </div>
        <p class="error-text" id="form-error" hidden></p>
      </form>
    </div>
  `;

  const form = root.querySelector('#report-form');
  const imageInput = root.querySelector('#image-input');
  const imagePreview = root.querySelector('#image-preview');
  const uploadZone = root.querySelector('#upload-zone');
  const latInput = root.querySelector('#latitude');
  const lngInput = root.querySelector('#longitude');
  const locateBtn = root.querySelector('#locate-btn');
  const clearLocBtn = root.querySelector('#clear-loc-btn');
  const mapEl = root.querySelector('#location-map');
  const submitBtn = root.querySelector('#submit-btn');
  const errorEl = root.querySelector('#form-error');

  let mapInstance = null;
  let mapMarker = null;

  uploadZone.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      imagePreview.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  locateBtn.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      toast('Bu cihaz geolokasiyanı dəstəkləmir', 'warning');
      return;
    }
    locateBtn.disabled = true;
    locateBtn.textContent = 'Tapılır...';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        latInput.value = latitude.toFixed(6);
        lngInput.value = longitude.toFixed(6);
        clearLocBtn.hidden = false;
        await showMap(latitude, longitude);
        locateBtn.disabled = false;
        locateBtn.textContent = 'Yenidən tap';
        toast('Konum əlavə edildi', 'success');
      },
      (err) => {
        console.error(err);
        toast('Konum alınmadı', 'error');
        locateBtn.disabled = false;
        locateBtn.textContent = 'Konumu Avtomatik Tap';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  clearLocBtn.addEventListener('click', () => {
    latInput.value = '';
    lngInput.value = '';
    clearLocBtn.hidden = true;
    mapEl.hidden = true;
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
      mapMarker = null;
    }
  });

  async function showMap(lat, lng) {
    const L = (await import('leaflet')).default;
    mapEl.hidden = false;
    if (!mapInstance) {
      mapInstance = L.map(mapEl).setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapInstance);
      mapMarker = L.marker([lat, lng]).addTo(mapInstance);
      setTimeout(() => mapInstance.invalidateSize(), 80);
    } else {
      mapInstance.setView([lat, lng], 15);
      mapMarker.setLatLng([lat, lng]);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Göndərilir...';
    try {
      const formData = new FormData();
      formData.append('title', form.title.value.trim());
      formData.append('description', form.description.value.trim());
      if (latInput.value) formData.append('latitude', latInput.value);
      if (lngInput.value) formData.append('longitude', lngInput.value);
      if (imageInput.files[0]) formData.append('image', imageInput.files[0]);

      await api.createReport(formData);
      toast('Müraciətiniz qeydə alındı', 'success');
      navigate('/reports');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Müraciəti Göndər';
    }
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

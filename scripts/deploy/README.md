# Scripts de Despliegue - bioDashboard

Este directorio contiene la infraestructura de automatización de despliegues (CI/CD local) para el proyecto **bioDashboard**. El sistema está diseñado bajo un paradigma soberano de compilación remota y despliegue tolerante a fallos con cero tiempo de inactividad (Zero-Downtime Deployment).

## Estructura de Archivos

- `deploy.sh`: El wrapper interactivo principal. Carga la configuración local de `.deploy-target.env` y valida las opciones.
- `deploy-from-laptop.sh`: Empaqueta la rama actual y la envía al servidor, donde compila la imagen Docker de producción.
- `.deploy-target.env`: Configuración persistente del destino del despliegue (servidor, puerto, dominio).

---

## Modos de Uso

### 1. Despliegue a Producción (Rama Activa)
Despliega el código de tu rama local activa (HEAD) reemplazando la versión actual de producción en `biodashboard.cristianb.dev`:

```bash
# Asegúrate de estar en la rama que quieres desplegar (por ejemplo, master o una feature branch)
scripts/deploy/deploy.sh
```

*Nota: El script requiere que el árbol de trabajo de Git esté limpio. Si quieres forzar el despliegue con cambios locales sin confirmar, puedes pasar el flag `--allow-dirty`:*
```bash
scripts/deploy/deploy.sh --allow-dirty
```

### 2. Despliegue en Entorno de "Preview" Aislado (Recomendado para pruebas)
Despliega tu rama de desarrollo de forma aislada en un contenedor secundario del servidor con su propio subdominio, manteniendo intacto el sitio principal en producción:

```bash
scripts/deploy/deploy.sh --subdomain bio-preview --project bio-preview
```

**¿Qué hace esto?:**
1. Crea una carpeta separada en `/srv/proyectosDev/bio-preview`.
2. Busca un puerto libre en el servidor automáticamente para no colisionar con el puerto `4011` de producción.
3. Levanta un contenedor separado llamado `bio-preview-app`.
4. Enruta el tráfico en Caddy para que accedas de forma segura en `https://bio-preview.cristianb.dev`.

### 3. Regresar a Master o Deshacer Cambios
Si desplegaste una rama de desarrollo sobre producción y deseas regresar a la versión estable:

```bash
git checkout master
scripts/deploy/deploy.sh
```

---

## Flujo del Despliegue bajo el capó

1. **Empaquetado:** El script comprime la rama local (`git archive HEAD`).
2. **Transferencia:** Sube el código fuente y las variables de entorno de producción al servidor por SSH/Tailscale.
3. **Compilación Remota:** Ejecuta `docker build` en tu servidor (reduciendo la carga en tu laptop y asegurando compatibilidad de arquitectura).
4. **Despliegue Tolerante a Fallos:** Levanta el nuevo contenedor, ejecuta un healthcheck (`/api/health`), y **si falla, aborta el despliegue y restaura la versión anterior** sin caída de servicio.
5. **Políticas de Retención:** Limpia automáticamente las versiones y las imágenes de Docker más antiguas para ahorrar almacenamiento (conserva las últimas 2 por defecto).

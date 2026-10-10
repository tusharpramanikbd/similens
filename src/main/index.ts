import { app, shell, BrowserWindow, dialog, ipcMain, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { scanPhotoFolder } from '@main/services/photoScanner'
import type { PhotoScanResponse, PhotoThumbnailUrlMap } from '@shared/types/photo'
import { analyzePhotoSimilarity } from '@main/services/similarity/similarityAnalyzer'
import type { SimilarityAnalysisResponse } from '@shared/types/similarity'
import { registerPhotoProtocolHandler } from '@main/services/photoProtocol'
import { registerAccessiblePhotos, getPhotoThumbnailUrl } from '@main/services/photoAccessRegistry'

// Registers the local image scheme before Electron becomes ready.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'similens-photo',
    privileges: {
      standard: true,
      secure: true
    }
  }
])

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // The development server enables renderer hot reload; production loads the built HTML.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.tusharpramanik.similens')

  registerPhotoProtocolHandler()

  // Toolkit shortcuts toggle DevTools with F12 in development and disable reload in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('dialog:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle(
    'photos:scan-folder',
    async (_, folderPath: string): Promise<PhotoScanResponse> => {
      registerAccessiblePhotos([])

      try {
        const result = await scanPhotoFolder(folderPath)

        registerAccessiblePhotos(result.photos)

        return {
          success: true,
          result
        }
      } catch (error) {
        console.error('Failed to scan folder:', error)

        return {
          success: false,
          error: 'Unable to scan this folder.'
        }
      }
    }
  )

  ipcMain.handle(
    'photos:analyze-similarity',
    async (_, photoPaths: string[]): Promise<SimilarityAnalysisResponse> => {
      try {
        const groups = await analyzePhotoSimilarity(photoPaths)

        return {
          success: true,
          groups
        }
      } catch (error) {
        console.error('Failed to analyze photo similarity:', error)

        return {
          success: false,
          error: 'Unable to analyze photo similarity.'
        }
      }
    }
  )

  ipcMain.handle('photos:get-thumbnail-urls', (_, photoPaths: string[]): PhotoThumbnailUrlMap => {
    const thumbnailUrls: PhotoThumbnailUrlMap = {}

    for (const photoPath of photoPaths) {
      thumbnailUrls[photoPath] = getPhotoThumbnailUrl(photoPath)
    }

    return thumbnailUrls
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Closing the last window quits the app except on macOS, where it remains active.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

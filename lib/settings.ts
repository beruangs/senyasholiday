import dbConnect from './mongodb'
import { SystemSetting } from '@/models'

export async function getSystemSetting(key: string, defaultValue: any = null) {
    try {
        await dbConnect()
        const setting = await SystemSetting.findOne({ key }).lean() as any
        return setting ? setting.value : defaultValue
    } catch (error) {
        console.error(`Error fetching system setting ${key}:`, error)
        return defaultValue
    }
}

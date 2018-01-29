/**
 * Created by xugaobo on 2017/9/12.
 */
export const STATIC_API = `//${window.location.host}`;

export const API_BASE_URL = process.env.NODE_ENV === 'development' ? '//api-train.jd.id/api' : '//api-train.jd.id/tiket-kereta/api'
import asyncio
import uuid
import logging
from typing import Callable, Dict, Any

logger = logging.getLogger("queue_manager")

class QueueManager:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.jobs: Dict[str, Any] = {}
        self.workers = []

    async def add_job(self, func: Callable, *args, **kwargs) -> str:
        """เพิ่มงานเข้าคิวและคืนค่า Job ID"""
        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {"status": "pending", "result": None, "error": None}
        await self.queue.put((job_id, func, args, kwargs))
        return job_id

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """เช็คสถานะของงาน"""
        return self.jobs.get(job_id, {"status": "not_found"})

    async def _worker(self):
        """Worker สำหรับดึงงานจากคิวมาทำ"""
        while True:
            job_id, func, args, kwargs = await self.queue.get()
            self.jobs[job_id]["status"] = "processing"
            try:
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                self.jobs[job_id]["status"] = "completed"
                self.jobs[job_id]["result"] = result
            except Exception as e:
                logger.error(f"Job {job_id} failed: {str(e)}")
                self.jobs[job_id]["status"] = "failed"
                self.jobs[job_id]["error"] = str(e)
            finally:
                self.queue.task_done()

    def start(self, num_workers: int = 1):
        """เริ่มการทำงานของ Worker ตามจำนวนที่กำหนด"""
        for _ in range(num_workers):
            task = asyncio.create_task(self._worker())
            self.workers.append(task)

    async def stop(self):
        """หยุดการทำงานของคิวทั้งหมดเมื่อเซิร์ฟเวอร์ปิด"""
        await self.queue.join()
        for task in self.workers:
            task.cancel()

# สร้าง Instance หลักไว้เรียกใช้จากที่อื่น
queue_manager = QueueManager()

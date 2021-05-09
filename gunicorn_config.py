import multiprocessing

#端口
bind = '0.0.0.0:8102'

#线程数
workers = multiprocessing.cpu_count() * 1

#守护进程启动
daemon = True

# 设置错误信息日志路径
errorlog = 'log/error.log'
# 设置访问日志路径
accesslog = 'log/access.log'

---
id: springboot-failure-analyzer
title: SpringBoot详细打印启动时异常堆栈信息
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [SpringBoot]
categories: [SpringBoot]
date: 2019-09-30 11:04:11
keywords: springboot,failure,恒宇少年
description: 'SpringBoot详细打印启动时异常堆栈信息'
---
`SpringBoot`在项目启动时如果遇到异常并不能友好的打印出具体的`堆栈错误信息`，我们只能查看到简单的错误消息，以致于并不能及时解决发生的问题，针对这个问题`SpringBoot`提供了故障分析仪的概念（failure-analyzer），内部根据不同类型的异常提供了一些实现，我们如果想自定义该怎么去做？

<!--more-->

## FailureAnalyzer
SpringBoot提供了启动异常分析接口`FailureAnalyzer`，该接口位于`org.springframework.boot.diagnostics`package内。
内部仅提供一个分析的方法，源码如下所示：
```java
@FunctionalInterface
public interface FailureAnalyzer {

	/**
	 * Returns an analysis of the given {@code failure}, or {@code null} if no analysis
	 * was possible.
	 * @param failure the failure
	 * @return the analysis or {@code null}
	 */
	FailureAnalysis analyze(Throwable failure);

}
```
该接口会把遇到的异常对象实例`Throwable failure`交付给实现类，实现类进行自定义处理。

## AbstractFailureAnalyzer

`AbstractFailureAnalyzer`是`FailureAnalyzer`的基础实现抽象类，实现了`FailureAnalyzer`定义的`analyze(Throwable failure)`方法，并提供了一个指定异常类型的抽象方法`analyze(Throwable rootFailure, T cause)`，源码如下所示：

```java
public abstract class AbstractFailureAnalyzer<T extends Throwable> implements FailureAnalyzer {

	@Override
	public FailureAnalysis analyze(Throwable failure) {
		T cause = findCause(failure, getCauseType());
		if (cause != null) {
			return analyze(failure, cause);
		}
		return null;
	}

	/**
	 * Returns an analysis of the given {@code rootFailure}, or {@code null} if no
	 * analysis was possible.
	 * @param rootFailure the root failure passed to the analyzer
	 * @param cause the actual found cause
	 * @return the analysis or {@code null}
	 */
	protected abstract FailureAnalysis analyze(Throwable rootFailure, T cause);

	/**
	 * Return the cause type being handled by the analyzer. By default the class generic
	 * is used.
	 * @return the cause type
	 */
	@SuppressWarnings("unchecked")
	protected Class<? extends T> getCauseType() {
		return (Class<? extends T>) ResolvableType.forClass(AbstractFailureAnalyzer.class, getClass()).resolveGeneric();
	}

	@SuppressWarnings("unchecked")
	protected final <E extends Throwable> E findCause(Throwable failure, Class<E> type) {
		while (failure != null) {
			if (type.isInstance(failure)) {
				return (E) failure;
			}
			failure = failure.getCause();
		}
		return null;
	}

}
```

通过`AbstractFailureAnalyzer`源码我们可以看到，它在实现于`FailureAnalyzer`的接口方法内进行了特殊处理，根据`getCauseType()`方法获取当前类定义的第一个泛型类型，也就是我们需要分析的指定`异常类型`。

获取泛型异常类型后根据方法`findCause`判断`Throwable`是否与泛型异常类型匹配，如果匹配直接返回给`SpringBoot`进行注册处理。

## SpringBoot提供的分析实现

`SpringBoot`内部通过实现`AbstractFailureAnalyzer`抽象类定义了一系列的针对性异常类型的启动分析，如下图所示：

![](/images/post/springboot-failure-analyzer.png)

## 指定异常分析

`SpringBoot`内部提供的启动异常分析都是指定具体的异常类型实现的，最常见的一个错误就是端口号被占用（`PortInUseException`），虽然`SpringBoot`内部提供一个这个异常的启动分析，我们也是可以进行替换这一异常分析的，我们只需要创建`PortInUseException`异常的`AbstractFailureAnalyzer`，并且实现类注册给`SpringBoot`即可，实现自定义如下所示：

```java
/**
 * 端口号被占用{@link PortInUseException}异常启动分析
 *
 * @author 恒宇少年
 */
public class PortInUseFailureAnalyzer extends AbstractFailureAnalyzer<PortInUseException> {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(PortInUseFailureAnalyzer.class);

    @Override
    protected FailureAnalysis analyze(Throwable rootFailure, PortInUseException cause) {
        logger.error("端口被占用。", cause);
        return new FailureAnalysis("端口号：" + cause.getPort() + "被占用", "PortInUseException", rootFailure);
    }
}
```

## 注册启动异常分析

在上面我们只是编写了指定异常启动分析，我们接下来需要让它生效，这个生效方式比较特殊，类似于自定义`SpringBoot Starter AutoConfiguration`的形式，我们需要在`META-INF/spring.factories`文件内进行定义，如下所示：

```
org.springframework.boot.diagnostics.FailureAnalyzer=\
  org.minbox.chapter.springboot.failure.analyzer.PortInUseFailureAnalyzer
```

**那我们为什么需要使用这种方式定义呢？**

项目启动遇到的异常顺序不能确定，很可能在`Spring IOC`并未执行初始化之前就出现了异常，我们不能通过`@Component`注解的形式使其生效，所以`SpringBoot`提供了通过`spring.factories`配置文件的方式定义。

## 启动异常分析继承关系

自定义的运行异常一般都是继承自`RuntimeException`，如果我们定义一个`RuntimeException`的异常启动分析实例会是什么效果呢？

```java
/**
 * 项目启动运行时异常{@link RuntimeException}统一启动分析
 *
 * @author 恒宇少年
 */
public class ProjectBootUnifiedFailureAnalyzer extends AbstractFailureAnalyzer<RuntimeException> {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(ProjectBootUnifiedFailureAnalyzer.class);

    @Override
    protected FailureAnalysis analyze(Throwable rootFailure, RuntimeException cause) {
        logger.error("遇到运行时异常", cause);
        return new FailureAnalysis(cause.getMessage(), "error", rootFailure);
    }
}
```

将该类也一并注册到`spring.factories`文件内，如下所示：

```
org.springframework.boot.diagnostics.FailureAnalyzer=\
  org.minbox.chapter.springboot.failure.analyzer.PortInUseFailureAnalyzer,\
  org.minbox.chapter.springboot.failure.analyzer.ProjectBootUnifiedFailureAnalyzer
```

运行项目并测试`端口号被占用异常`我们会发现，并没有执行`ProjectBootUnifiedFailureAnalyzer`内的`analyze`方法，而是继续执行了`PortInUseFailureAnalyzer`类内的方法。

那我们将`PortInUseFailureAnalyzer`这个启动分析从`spring.factories`文件内`暂时删除掉`，再来运行项目我们会发现这时却是会执行`ProjectBootUnifiedFailureAnalyzer`类内分析方法。

## 总结

根据本章我们了解了`SpringBoot`提供的启动异常分析接口以及基本抽象实现类的运作原理，而且启动异常分析存在分析泛型异常类的上下级继承关系，**异常子类的启动分析会覆盖掉异常父类的启动分析**，如果你想包含全部异常的启动分析可以尝试使用`Exception`作为`AbstractFailureAnalyzer`的泛型参数。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，源码分支为`2.x`，目录为`spring-boot-failure-analyzer`：
- Gitee：[https://gitee.com/hengboy/spring-boot-chapter](https://gitee.com/hengboy/spring-boot-chapter)
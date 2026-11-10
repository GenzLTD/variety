<template>
  <div class="not-found-page">
    <div class="container">
      <div class="not-found-content" data-aos="fade-up">
        <h1 class="error-code">建设中</h1>
        <p>这个栏目还在整理，先回到首页看看其他内容。</p>
        <router-link to="/" class="btn btn-primary btn-large">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found-page {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bolent-gradient);

  .not-found-content {
    text-align: center;
    color: white;

    .error-code {
      font-size: 3.5rem;
      font-weight: bold;
      margin-bottom: 24px;
      color: white;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    p {
      font-size: 1.125rem;
      margin-bottom: 40px;
      opacity: 0.9;
    }

    .btn {
      background: white;
      color: var(--primary-color);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
      }
    }
  }
}

@media (max-width: 768px) {
  .not-found-page {
    .not-found-content {
      .error-code {
        font-size: 2.4rem;
      }

    }
  }
}
</style>
